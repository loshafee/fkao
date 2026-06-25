// 竹马法考真题收集 v5 — addEventListener 拦截版
// 网站已拦截 XMLHttpRequest.prototype.send，改用 addEventListener 钩子

(function() {
  if (window.__zhumaCollector) {
    console.log('⚠️ 收集器已在运行，已收集: ' + window.__zhumaCollector.questions.size + ' 题');
    return;
  }

  var collector = { questions: new Map(), total: 124 };
  window.__zhumaCollector = collector;

  // 挂钩 addEventListener，在网站的 load 事件前截获响应数据
  var origAE = XMLHttpRequest.prototype.addEventListener;
  XMLHttpRequest.prototype.addEventListener = function(type, listener, options) {
    var self = this;
    var wrapped = function(evt) {
      try {
        var text = self.responseText;
        if (text && text.length > 100) {
          var json = JSON.parse(text);
          if (json && json.data && json.data.questions) {
            json.data.questions.forEach(function(q) {
              if (q.id && q.question) collector.questions.set(q.id, q);
            });
            if (json.data.questionsIds) collector.total = json.data.questionsIds.length;
            console.log('📥 已收集 ' + collector.questions.size + '/' + collector.total + ' 题');
          }
        }
      } catch(e) {}
      return listener.call(self, evt);
    };
    return origAE.call(self, type, wrapped, options);
  };

  // 下载函数
  window.downloadQuestions = function() {
    var arr = [];
    collector.questions.forEach(function(v) { arr.push(v); });
    if (arr.length === 0) { console.log('❌ 还没收集到题目，先做几道题'); return; }
    var types = { '01': '单选', '02': '多选', '03': '不定项' };
    var dist = {};
    arr.forEach(function(q) {
      var t = types[q.kind] || q.kind;
      dist[t] = (dist[t] || 0) + 1;
    });
    console.log('✅ 共 ' + arr.length + ' 题', JSON.stringify(dist));
    var blob = new Blob([JSON.stringify(arr, null, 2)], { type: 'application/json' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'zhuma_obj1_' + new Date().toISOString().slice(0,10) + '.json';
    a.click();
    console.log('📥 下载中...');
  };

  console.log('✅ 收集器 v5 已激活！做题翻页，做完输入 downloadQuestions()');
})();
