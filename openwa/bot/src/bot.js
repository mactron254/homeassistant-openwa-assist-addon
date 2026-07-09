'use strict';

const path = require('node:path');
const { BOT_DATA_DIR } = require('./options');
const { ConversationStore } = require('./store');
const { preparePcmFromMedia, cleanupFiles } = require('./audio');
const {
  isAllowedSender,
  senderFromMessage,
  menuText,
  normalizeText,
  isConfirm,
  isAudioRequest,
  isNegativeAudioRequest,
  openWaMessagesFromPayload,
} = require('./core');

class AssistBot {
  constructor({ options, openwa, assist, store }) {
    this.options = options;
    this.openwa = openwa;
    this.assist = assist;
    this.store = store || new ConversationStore(options);
  }

  async handleOpenWaPayload(payload) {
    const items = openWaMessagesFromPayload(payload, this.options.session_id);
    for (const item of items) {
      const message = item.message;
      if (message.fromMe || message.isStatusBroadcast) continue;
      if (!isAllowedSender(message, this.options.allowed_senders)) {
        console.warn('[OpenWA Assist] unauthorized sender ignored: ' + senderFromMessage(message) + '. loaded_allowed_senders=' + JSON.stringify(this.options.allowed_senders || []) + '. Add it to whatsapp.allowed_senders if trusted.');
        continue;
      }
      const chatId = message.chatId || message.from;
      const sessionId = item.sessionId || this.options.session_id;
      if (!chatId || !sessionId) {
        console.warn('[OpenWA Assist] message ignored: missing chatId/sessionId sender=' + senderFromMessage(message) + ' chatId=' + (chatId || '') + ' sessionId=' + (sessionId || ''));
        continue;
      }
      console.log('[OpenWA Assist] handling message sender=' + senderFromMessage(message) + ' chatId=' + chatId + ' sessionId=' + sessionId);
      const response = await this.handleMessage(message);
      await this.sendReply({ response, sessionId, chatId });
      console.log('[OpenWA Assist] reply sent chatId=' + chatId);
    }
  }

  async handleMessage(message) {
    if (!this.assist.enabled()) return { text: 'Assist no esta activado en el add-on.' };
    const sender = senderFromMessage(message);
    if (this.isAudioMessage(message)) return this.handleAudio(message, sender);
    const text = String(message.body || '').trim();
    if (!text || normalizeText(text) === 'menu') return { text: menuText() };
    return this.processText(text, sender, { preferAudio: this.shouldSendAudio(message, text) });
  }

  async handleAudio(message, sender) {
    if (!this.options.assist.audio.enabled) return { text: 'Audio desactivado en el add-on.' };
    if (!message.media?.data) return { text: 'Audio recibido, pero OpenWA no entrego el archivo.' };
    let prepared;
    try {
      prepared = await preparePcmFromMedia(message.media);
      if (prepared.duration > this.options.assist.audio.max_audio_seconds) {
        return { text: `Audio demasiado largo (${Math.round(prepared.duration)} s). Maximo: ${this.options.assist.audio.max_audio_seconds} s.` };
      }
      const transcript = await this.assist.transcribePcm(prepared.pcm);
      return this.processText(transcript, sender, { preferAudio: this.shouldSendAudio(message, transcript), transcript });
    } finally {
      if (prepared) cleanupFiles(prepared.input, prepared.pcm);
    }
  }

  async processText(text, sender, context = {}) {
    if (isConfirm(text)) {
      const pending = this.store.consumePending(sender);
      if (pending) return this.forwardToAssist(pending.text, sender, pending);
    }
    if (matchesCriticalPattern(text, this.options.assist.safety.confirm_before_patterns)) {
      this.store.setPending(sender, { text, preferAudio: context.preferAudio === true });
      return { text: `Accion critica detectada: "${text}". Responde SI para confirmar.` };
    }
    return this.forwardToAssist(text, sender, context);
  }

  async forwardToAssist(text, sender, context = {}) {
    const item = this.store.get(sender);
    const conversationId = item?.conversation_id || '';
    const wantsAudio = context.preferAudio === true;
    const result = wantsAudio
      ? await this.assist.runTextToSpeech(text, conversationId)
      : await this.assist.processConversation(text, conversationId);
    if (result.conversation_id) this.store.setConversation(sender, result.conversation_id);
    return {
      text: result.text || 'Assist no devolvio respuesta.',
      tts_output: result.tts_output || null,
      includeText: this.options.assist.audio.include_text_with_audio !== false,
      transcript: context.transcript || '',
    };
  }

  shouldSendAudio(message, text) {
    const audio = this.options.assist.audio || {};
    if (!audio.enabled) return false;
    if (isNegativeAudioRequest(text)) return false;
    const mode = audio.response_mode || 'voice_input_or_requested';
    const voiceInput = this.isAudioMessage(message);
    const requested = isAudioRequest(text);
    if (mode === 'always') return true;
    if (mode === 'requested') return requested;
    if (mode === 'voice_input') return voiceInput;
    if (mode === 'never') return false;
    return voiceInput || requested;
  }

  isAudioMessage(message) {
    return ['audio', 'voice'].includes(message?.type) || /^audio\//i.test(message?.media?.mimetype || '');
  }

  async sendReply({ response, sessionId, chatId }) {
    const text = response?.text || '';
    if (!response?.tts_output) {
      if (text) await this.openwa.sendText(sessionId, chatId, text);
      return;
    }
    let audio;
    let textSent = false;
    try {
      audio = await this.assist.downloadTtsAsVoiceNote(response.tts_output);
      if (response.includeText !== false && text) {
        await this.openwa.sendText(sessionId, chatId, text);
        textSent = true;
      }
      await this.openwa.sendAudio(sessionId, chatId, { ...audio, ptt: true });
    } catch (error) {
      console.error('[OpenWA Assist] audio reply failed:', error.message);
      if (!textSent && text) await this.openwa.sendText(sessionId, chatId, text);
    } finally {
      if (audio?.cleanup) audio.cleanup();
    }
  }
}

function matchesCriticalPattern(text, patterns = []) {
  const value = normalizeText(text);
  return patterns.some(pattern => pattern && value.includes(normalizeText(pattern)));
}

module.exports = { AssistBot, matchesCriticalPattern };

