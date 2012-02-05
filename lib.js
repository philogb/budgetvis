(function () {
  //Utility functions
  window.$ = function(d) {
    return document.getElementById(d);
  };

  $.empty = function() {};

  $.type = (function() {
    var oString = Object.prototype.toString,
        re = /^\[object\s(.*)\]$/,
        type = function(e) { return oString.call(e).match(re)[1].toLowerCase(); };
    
    return function(elem) {
      var elemType = type(elem);
      if (elemType != 'object') {
        return elemType;
      }
      if (elem.$$family) return elem.$$family;
      return (elem && elem.nodeName && elem.nodeType == 1)? 'element' : elemType;
    };
  })();

  (function() {
    function detach(elem) {
      var type = $.type(elem), ans;
      if (type == 'object') {
        ans = {};
        for (var p in elem) {
          ans[p] = detach(elem[p]);
        }
        return ans;
      } else if (type == 'array') {
        ans = [];
        for (var i = 0, l = elem.length; i < l; i++) {
          ans[i] = detach(elem[i]);
        }
        return ans;
      } else {
        return elem;
      }
    }

    $.merge = function() {
      var mix = {};
      for (var i = 0, l = arguments.length; i < l; i++){
          var object = arguments[i];
          if ($.type(object) != 'object') continue;
          for (var key in object){
              var op = object[key], mp = mix[key];
              if (mp && $.type(op) == 'object' && $.type(mp) == 'object') {
                mix[key] = $.merge(mp, op);
              } else{
                mix[key] = detach(op);
              }
          }
      }
      return mix;
    };
  })();

  window.IO = {};

  var XHR = function(opt) {
    opt = $.merge({
      url: 'http://philogb.github.com/',
      method: 'GET',
      async: true,
      noCache: false,
      //body: null,
      sendAsBinary: false,
      onProgress: $.empty,
      onSuccess: $.empty,
      onError: $.empty,
      onAbort: $.empty,
      onComplete: $.empty
    }, opt || {});

    this.opt = opt;
    this.initXHR();
  };

  XHR.State = {};
  ['UNINITIALIZED', 'LOADING', 'LOADED', 'INTERACTIVE', 'COMPLETED'].forEach(function(stateName, i) {
    XHR.State[stateName] = i;
  });

  XHR.prototype = {
    initXHR: function() {
      var req = this.req = new XMLHttpRequest(),
          that = this;

      ['Progress', 'Error', 'Abort', 'Load'].forEach(function(event) {
        req['on' + event.toLowerCase()] = function(e) {
          that['handle' + event](e);
        };
      });
    },
    
    send: function(body) {
      var req = this.req,
          opt = this.opt,
          async = opt.async;
      
      if (opt.noCache) {
        opt.url += (opt.url.indexOf('?') >= 0? '&' : '?') + $.uid();
      }

      req.open(opt.method, opt.url, async);
      
      if (async) {
        req.onreadystatechange = function(e) {
          if (req.readyState == XHR.State.COMPLETED) {
            if (req.status == 200) {
              opt.onSuccess(req.responseText);
            } else {
              opt.onError(req.status);
            }
          }
        };
      }
      
      if (opt.sendAsBinary) {
        req.sendAsBinary(body || opt.body || null);
      } else {
        req.send(body || opt.body || null);
      }

      if (!async) {
        if (req.status == 200) {
          opt.onSuccess(req.responseText);
        } else {
          opt.onError(req.status);
        }
      }
    },

    setRequestHeader: function(header, value) {
      this.req.setRequestHeader(header, value);
      return this;
    },

    handleProgress: function(e) {
      if (e.lengthComputable) {
        this.opt.onProgress(e, Math.round(e.loaded / e.total * 100));
      } else {
        this.opt.onProgress(e, -1);
      }
    },

    handleError: function(e) {
      this.opt.onError(e);
    },

    handleAbort: function() {
      this.opt.onAbort(e);
    },

    handleLoad: function(e) {
       this.opt.onComplete(e);
    }
  };

  IO.XHR = XHR;

})();

