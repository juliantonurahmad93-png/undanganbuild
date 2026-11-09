export const AUDIO_MODES = [
  { key: "soft", label: "Ambient Lembut" },
  { key: "nature", label: "Suara Alam" },
  { key: "beat", label: "Ritme Ringan" },
] as const;

export type AudioMode = 0 | 1 | 2;

class AmbientAudio {
  private ctx: AudioContext | null = null;
  private nodes: Array<OscillatorNode | GainNode | AudioBufferSourceNode> = [];
  private audio: HTMLAudioElement | null = null;
  private currentUrl = "";

  async start(mode: AudioMode, url?: string) {
    this.stop();
    const src = (url || "").trim();
    if (src) {
      try {
        this.currentUrl = src;
        const a = new Audio(src);
        a.loop = true;
        a.preload = "auto";
        a.volume = 0.7;
        this.audio = a;
        await a.play();
        return;
      } catch {
        // fall back to synth if custom URL blocked/invalid
        this.audio = null;
        this.currentUrl = "";
      }
    }
    try {
      const Ctx = window.AudioContext || (window as any).webkitAudioContext;
      if (!Ctx) return;
      this.ctx = new Ctx();
      const gain = this.ctx.createGain();
      gain.gain.value = 0.025;
      gain.connect(this.ctx.destination);
      const osc = this.ctx.createOscillator();
      osc.type = mode === 2 ? "triangle" : "sine";
      osc.frequency.value = mode === 0 ? 220 : mode === 1 ? 174 : 196;
      osc.connect(gain); osc.start();
      this.nodes.push(osc, gain);
    } catch {}
  }

  getUrl() { return this.currentUrl; }

  stop() {
    if (this.audio) {
      try { this.audio.pause(); this.audio.src = ""; this.audio.load(); } catch {}
      this.audio = null;
    }
    this.currentUrl = "";
    this.nodes.forEach((n: any) => { try { n.stop?.(); n.disconnect?.(); } catch {} });
    this.nodes = []; this.ctx?.close().catch(()=>{}); this.ctx = null;
  }
}
export const ambient = new AmbientAudio();
