---
---
// Keep the upstream worker protocol and all ordinary rendering methods.
importScripts('/scripts/signum-congruentiae.js');
importScripts('https://verovio-script.humdrum.org/scripts/verovio-worker.js');

// Some Verovio builds omit the initial meter when a mensuration sign is shown.
// Recover only missing values from the filtered Humdrum token identified by MEI;
// retain explicit meters, including meters derived from later proportion signs.
function restoreHumdrumMeters(mei, humdrum) {
  const lines = humdrum.split(/\r\n|\n|\r/);
  return mei.replace(/<meterSig\b[^>]*>/g, tag => {
    const location = tag.match(/\bxml:id="metersig-L(\d+)F(\d+)"/);
    if (!location) return tag;
    const line = lines[Number(location[1]) - 1];
    const token = line && line.split('\t')[Number(location[2]) - 1];
    const meter = token && token.match(/^\*M(\d+)\/(\d+)$/);
    if (!meter) return tag;
    let attributes = '';
    if (!/\bcount=/.test(tag)) attributes += ' count="' + meter[1] + '"';
    if (!/\bunit=/.test(tag)) attributes += ' unit="' + meter[2] + '"';
    return tag.replace(/\s*\/?>$/, ending => attributes + ending);
  });
}

const initialize = verovio.module.onRuntimeInitialized;
verovio.module.onRuntimeInitialized = () => {
  initialize();
  const render = methods.renderData;
  methods.renderData = function(options, data, page, force) {
    const historicalSigns = /\bjrp-sc-(?:up|down)\b/.test(data);
    // Apply analysis filters during Humdrum import once. Retain their processed
    // Humdrum output for the plugin, then repair MEI before re-layout if needed.
    // Let the upstream importer validate and apply embedded options/filters.
    // Discard its initial SVG when meter or historical-sign repairs are needed.
    const svg = render.call(this, historicalSigns
      ? Object.assign({}, options, JRPsignum.fontOptions()) : options, data, page, force);
    if (!historicalSigns && !/^\s*[!*]/.test(data)) return svg;
    const humdrum = this.vrvToolkit.getHumdrum();
    const originalMEI = this.vrvToolkit.getMEI();
    let mei = restoreHumdrumMeters(originalMEI, humdrum);
    if (!historicalSigns && mei === originalMEI) return svg;
    if (historicalSigns) mei = JRPsignum.prepareMEI(mei);
    this.vrvToolkit.setOptions(Object.assign({inputFrom: 'mei'},
      historicalSigns ? JRPsignum.fontOptions() : {}));
    const loaded = this.vrvToolkit.loadData(mei);
    // Input-format options persist across imports, even after resetOptions().
    this.vrvToolkit.setOptions({inputFrom: options.inputFrom || 'auto'});
    if (!loaded) throw new Error('Unable to load prepared score');
    this.pageCount = this.vrvToolkit.getPageCount();
    if (!this.pageCount) throw new Error('Score has no pages');
    this.page = page || this.page || 1;
    if (this.page > this.pageCount) this.page = 1;
    this.humdrumOutput = humdrum;
    return this.vrvToolkit.renderToSVG(this.page);
  };
};
