(() => {
  var oldSyncChain = M.Flow.syncChain;
  M.Flow.syncChain = funcs => {
    var f = oldSyncChain(funcs);
    var api = {};

    var insert_ = offset => (name, func) => {
      var i = 0;
      for ( ; i < f.chain.length ; i++ ) {
        let cmpF = f.chain[i];
        if ( typeof cmpF === 'function' ) continue;
        if ( cmpF.name == name ) break;
      }
      if ( i == f.chain.length ) throw new Error(
        `${name} is not in the chain`);
      f.chain.splice(i + offset,0,func);
    }
    api.insertBefore = insert_(0);
    api.insertAfter = insert_(1);
    f.chainAPI = api;
    return f;
  };
})();
