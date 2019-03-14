let csl = chrome.storage.local,
cr = chrome.runtime;

var ls = {
  get: function(i){
    let res = JSON.parse(crypt.h2b(localStorage.getItem(i)));
    console.log(res)
    return res;

  },
  set: function(i,e){
    localStorage.setItem(i, crypt.b2h(JSON.stringify(e)))
  }
}

function changeFilter(){
  try{
    csl.get(function(i) {
      if ( !_.isInteger(i.profile) || !_.eq(i.status, 'unlock')) {
        console.log('no user detected')
        return;
      }

      let filter = {
        urls: [i.data[i.profile].url]
      };

      if(_.eq(i.data[i.profile].url,'')){
        filter.urls = ['<all_urls>'];
      }

      if(_.eq(_.indexOf(i.data[i.profile].types),-1)){
        filter.types = ['main_frame', 'sub_frame', 'stylesheet', 'script', 'image', 'font', 'object', 'xmlhttprequest', 'ping', 'csp_report', 'media', 'websocket', 'other']
      } else {
        filter.types = i.data[i.profile].types;
      }
      ls.set('filter', filter)
    })
  } catch(e){
    if(e) { return console.log(e) }
  }
}

function changeHeaders(){
  try{
    csl.get(function(i){
      if ( !_.isInteger(i.profile) || !_.eq(i.status, 'unlock')) {
        console.log('no user detected')
        return;
      }
        _.forEach(i.data[i.profile].store, function(x) {
          details.requestHeaders.push({
            name: x.name,
            value: x.value
          })
        })
        console.log(details.requestHeaders)
        return {
          requestHeaders: details.requestHeaders
        };
      })
  } catch(e){
    if(e) { return console.log(e) }
  }
}

chrome.storage.onChanged.addListener(function(){
  console.log('change detected!')
  changeFilter()
})

try {
  chrome.webRequest.onBeforeSendHeaders.addListener(function(details) {
      _.forEach(JSON.parse(localStorage.getItem('store')), function(x) {
        if(!x.encrypted){
            details.requestHeaders.push({
              name: x.name,
              value: x.value
            })
          }
        })
      return {
        requestHeaders: details.requestHeaders
      };
    },
    ls.get('filter'),
    ['blocking', 'requestHeaders']
  );
} catch (err) {
  if(err) { return console.log(err) }
}
