// Use the local font-aware worker with the existing plugin request queue.
vrvInterface.prototype.createWorkerInterface = function(onReady) {
  const vrv = this;
  this.promises = {};
  this.promiseIdx = 0;
  this.resolvedIdx = 0;
  this.renderDataPending = 0;
  this.renderDataWaiting = null;
  this.worker = new Worker('/scripts/signum-congruentiae-worker.js');
  this.worker.addEventListener('message', function(event) {
    if (event.data.method === 'ready') {
      vrv.initialized = true;
      onReady();
      return;
    }
    while (vrv.resolvedIdx <= event.data.idx) {
      const pending = vrv.promises[vrv.resolvedIdx];
      if (pending) {
        if (vrv.resolvedIdx === event.data.idx && event.data.success) {
          pending.deferred.resolve(event.data.result);
        } else {
          pending.deferred.reject(event.data.result);
        }
        if (pending.method === 'renderData') {
          vrv.renderDataPending--;
          if (vrv.renderDataPending === 0) vrv.handleWaitingRenderData();
        }
        delete vrv.promises[vrv.resolvedIdx];
      }
      vrv.resolvedIdx++;
    }
  });
};
