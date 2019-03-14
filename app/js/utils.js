var canvasLoader;

var crypt = {
  h2b: function(i){
    return forge.util.hexToBytes(i);
  },
  b2h: function(i){
    return forge.util.bytesToHex(i);
  },
  sha256: function(i){
    var md = forge.md.sha256.create();
    md.update(i);
    return md.digest().toHex();
  },
  sha512: function(i){
    var md = forge.md.sha512.create();
    md.update(i);
    return md.digest().toHex();
  },
  gcmEnc: function(key, text){
    let fu = forge.util,
    iv = forge.random.getBytesSync(16),
    cipher = forge.cipher.createCipher('AES-GCM', fu.hexToBytes(key));
    cipher.start({
      iv:iv
    });
    cipher.update(fu.createBuffer(fu.createBuffer(text, 'utf8')));
    cipher.finish();
    let final = _.join([
      fu.bytesToHex(cipher.output.getBytes()),
      fu.bytesToHex(iv),
      fu.bytesToHex(cipher.mode.tag.getBytes())],':')
    return final;
  },
  gcmDec: function(key,text){
    let fu = forge.util,
    sep = _.split(text,':', 3),
    decipher = forge.cipher.createDecipher('AES-GCM', fu.hexToBytes(key));
    decipher.start({
      iv: fu.hexToBytes(sep[1]),
      tag: fu.createBuffer(fu.hexToBytes(sep[2]))
    });
    decipher.update(fu.createBuffer(fu.hexToBytes(sep[0])));
    decipher.finish();
    return decipher.output.toString('utf8')
  }
}

let schema = {
  item: {
    id:1,
    url:'',
    types:[],
    store:[{name:'',value:'',id:'1',encrypted:false}]
  }
}

function reload(i){
  setTimeout(function(){
    return location.reload();
  },i)
}

function newUser(i, ver){
  let arr = []
  arr.push(schema.item);
  try{
    csl.set({
      user: i,
      data: arr,
      status:'unlock',
      verify: ver,
      profile:0
    })
    toasty('user ' + i.username + ' successfully created')
    reload(1000)
  } catch(e){
    if (e) {
      toasty('unable to create user at this time. check your permissions.')
      return console.log(e)
    }
  }
}

function deleteProfile(){
  try{
    csl.get(function(i){
      if(_.eq(i.data.length,1)){
        return toasty('cannot delete the only profile')
      }
      let data = _.pull(i.data, i.data[i.profile]);
      i.data = data;
      i.profile = 0;
      //console.log(JSON.stringify(i,0,2))
      csl.set(i)
      toasty('delete profile success')
      reload(1000)
    })
  } catch(e){
    if(e){ return toasty('delete profile failed') }
  }
}

function newProfile(){
  try{
    csl.get(function(i){
      let current = i.data
      current.push(schema.item)
      csl.set({
        data: current
      })
    })
  } catch(e){
    if(e){ return toasty('unable to add profile') }
  } finally{
    toasty('new profile added')
    reload(1000)
  }
}

function changeProfile(i){
  try{
    csl.set({
      profile: parseInt(i)
    })
  } catch(e){
    if(e){ return toasty('unable to change profile') }
  } finally{
    toasty('profile set to '+ i)
    reload(1000)
  }
}
//csl.set({profile:0})

function updateUrl(url){
  try{
    csl.get(function(i){
      i.data[i.profile].url = url;
      csl.set(i)
    })
  } catch(e){
    if (e) {
      toasty('unable to update url at this time.')
      return console.log(e)
    }
  } finally {
    toasty('profile ' + i.profile + ' url updated')
    reload(1000)
  }
}

function updateProfile(profile){
  try{
    csl.get(function(i){
      i.data[i.profile].profile = profile
      csl.set(i)
    })
  } catch(e){
    if (e) {
      toasty('unable to update profile at this time.')
      return console.log(e)
    }
  } finally {
    toasty('profile changed to ' + profile)
    reload(1000)
  }
}

function deleteHeadItem(item){
  try{
    csl.get(function(i){
      if(_.eq(i.data[i.profile].store.length,1)){
        return toasty('cannot delete the only headder')
      }
      let data = _.reject(i.data[i.profile].store, item),
      count = 1;
      _.forEach(data,function(x,y){
        x.id = JSON.stringify(count)
        count++
      })
      //console.log(data)
      i.data[i.profile].store = data;
      csl.set(i)
      toasty('delete item success')
      reload(1000)
    })
  } catch(e){
    if(e){ return toasty('delete item failed') }
  }
}

function newHeadItem(){
  try{
    csl.get(function(i){
      let data = i.data[i.profile].store,
      obj = {
        name:'',
        value:'',
        id:JSON.stringify(data.length + 1),
        encrypted:false
      };
      data.push(obj)
      i.data[i.profile].store = data;
      csl.set(i)
    })
  } catch(e){
    if(e){ return toasty('create item failed') }
  } finally{
    toasty('create item success')
    reload(1000)
  }
}

function importItem(){
  let reader = new FileReader(),
  file = document.getElementById('importSelect').files[0];
  reader.onload = function (e) {
    try{
      let arr = JSON.parse(e.target.result);
      csl.get(function(i){
        let data = _.concat(i.data[i.profile].store,arr),
        count = 1;
        _.forEach(data,function(x,y){
          x.id = JSON.stringify(count)
          count++
        })
        i.data[i.profile].store = data;
        csl.set(i)
      })
      $('#importSelect').val('')
    } catch(err){
      if (err){ return toasty('import failure') }
    } finally{
      toasty('import success')
      reload(1000)
    }
  };
  reader.readAsText(file);

}

function exportItem(){
  try{
    csl.get(function(i){
      let data = i.data[i.profile].store,
      file = new File([JSON.stringify(data)],
      'headers.json', {
        type: "text/plain;charset=utf-8"
      });
      saveAs(file);
    })
  } catch(e){
    if(e){ return toasty('export failure') }
  } finally{
    toasty('export success')
  }
}

function commitHead(data){
  try{
    csl.get(function(i){
      i.data[i.profile].store = data
      csl.set(i)
    })
  } catch(e){
    if (e){
      return toasty('commit failed')
    }
  } finally {
    return toasty('commit success')
  }
}
//csl.set({store: []})

function updateUrl(){
  try{
    csl.get(function(i){
      let url = $('#url').val()
      i.data[i.profile].url = url;
      csl.set(i)
      return toasty('url updated')
    })
  } catch(e){
    if (e){
      return toasty('unable to update url')
    }
  }
}

function updateType(){
  try{
    let items = _.words($('#type').val()),
    filter = ['main_frame', 'sub_frame', 'stylesheet', 'script', 'image', 'font', 'object', 'xmlhttprequest', 'ping', 'csp_report', 'media', 'websocket', 'other'],
    arr = [],
    count = 0,
    notOf;

    csl.get(function(i){
      _.forEach(items,function(i){
        if(_.eq(_.indexOf(filter, i),-1)){
          notOf = i;
          return count++
        }
        arr.push(i)
        $('#type').val(_.join(arr,','))
      })
      //console.log(arr)
      i.data[i.profile].types = arr;
      csl.set(i)
      if(_.gt(count,0)){
        toasty(notOf + ' is not a correct type')
      } else {
        toasty('types updated')
      }
      return;
    })
  } catch(e){
    if (e){
      return toasty('unable to update url')
    }
  }
}

function encryptItems(){
  try{
    csl.get(function(i){
      let data = i.data[i.profile].store,
      arr = ['name', 'value'],
      count = 0;
      _.forEach(data, function(x){
        if(!x.encrypted){
          _.forEach(arr, function(y){
            x[y] = crypt.gcmEnc(localStorage.getItem('token'), x[y])
          })
          x.encrypted = true;
          //console.log(x.id + ' encrypted')
          count++
        } else{
          //console.log(x.id + ' already encrypted')
        }
      })
      i.data[i.profile].store = data;
      csl.set(i)
      toasty(count + 'items encrypted')
      return reload(1000)
    })
  } catch(e){
    if (e){
      return toasty('unable to encrypt data')
    }
  }
}

function decryptItems(){
  try{
    csl.get(function(i){
      let data = i.data[i.profile].store,
      arr = ['name', 'value'],
      count = 0;
      _.forEach(data, function(x){
        if(x.encrypted){
          _.forEach(arr, function(y){
            x[y] = crypt.gcmDec(localStorage.getItem('token'), x[y])
          })
          x.encrypted = false;
          //console.log(x.id + ' encrypted')
          count++
        } else{
          //console.log(x.id + ' already encrypted')
        }
      })
      i.data[i.profile].store = data;
      csl.set(i)
      toasty(count + ' items decrypted')
      return reload(1000)
    })
  } catch(e){
    if (e){
      return toasty('unable to decrypt data')
    }
  }
}


//enable privacy
function initPrivacy(){
  let cps = chrome.privacy.services,
  arr = [
    'autofillAddressEnabled',
    'autofillCreditCardEnabled',
    'autofillEnabled',
    'passwordSavingEnabled',
    'searchSuggestEnabled',
    'spellingServiceEnabled',
    'translationServiceEnabled'
  ]

  _.forEach(arr, function(i){
    try{
      cps[i].set({value: false})
      cps[i].get({}, function(x) {
        if (x.value){
          console.log(i + ' not disabled!')
        } else {
          console.log(i + ' disabled')
        }
      });
    } catch(e){
      if (e) { console.log(i + ' not disabled!') }
    }
  })
}


function toasty(i){
  let toasty = $('.toast.disposable')
  toasty.text(i).removeClass('fadeOutDown').addClass('fadeInUp');
  setTimeout(function () {
      toasty.removeClass('fadeInUp').addClass('fadeOutDown');
  }, 2500);
}


function getVersion(){
  return chrome.runtime.getManifest().version;
}

function checkVersion(){
  $.ajax({
    url: '/path/to/file',
    type: 'GET',
    dataType: 'json',
    data: {param1: 'value1'}
  })
  .done(function(data) {

    parseInt(_.replace(getVersion(), /\./g, ''))
    console.log("success");
  })
  .fail(function() {
    toasty("unable to check for updates");
  })

}
