---
---
// Keep the upstream worker protocol and all ordinary rendering methods.
importScripts('/scripts/signum-congruentiae.js');
importScripts('https://verovio-script.humdrum.org/scripts/verovio-worker.js');
const initialize = verovio.module.onRuntimeInitialized;
verovio.module.onRuntimeInitialized = () => {
  initialize();
  const render = methods.renderData;
  methods.renderData = function(options, data, page, force) {
    if (!/\bjrp-sc-(?:up|down)\b/.test(data)) {
      return render.call(this, options, data, page, force);
    }
    // Apply analysis filters during Humdrum import once. Retain their processed
    // Humdrum output for the plugin, then re-layout the native MEI symbols.
    // Let the upstream importer validate and apply embedded options/filters.
    // Its initial SVG is discarded; only the subsequent native layout is shown.
    render.call(this, Object.assign({}, options, JRPsignum.fontOptions()), data, page, force);
    const humdrum = this.vrvToolkit.getHumdrum();
    const mei = JRPsignum.prepareMEI(this.vrvToolkit.getMEI());
    this.vrvToolkit.setOptions(Object.assign({inputFrom: 'mei'}, JRPsignum.fontOptions()));
    if (!this.vrvToolkit.loadData(mei)) throw new Error('Unable to load historical signs');
    this.pageCount = this.vrvToolkit.getPageCount();
    if (!this.pageCount) throw new Error('Score has no pages');
    this.page = page || this.page || 1;
    if (this.page > this.pageCount) this.page = 1;
    this.humdrumOutput = humdrum;
    return this.vrvToolkit.renderToSVG(this.page);
  };
};
