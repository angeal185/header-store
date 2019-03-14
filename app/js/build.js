_.templateSettings.interpolate = /{{([\s\S]+?)}}/g;
let csl = chrome.storage.local;

const div = $('<div />'),
optBaseTpl = _.template('<div id="rules-box" class="w90"><h3><span id="ttl"></span><span id="profile" class="right">profile: </span></h3><hr></div><canvas id="canvas"></canvas>'),
divClsTpl = _.template('<div class="{{CLS}}">{{BODY}}</div>'),
navTpl = _.template('<nav><div class="logo left"><img src="/app/img/icon_32x32.png" height="50px"></div><ul id="navLinks" class="right"></ul></nav>'),
bottomNavTpl = _.template('<div class="nav-bottom"><div class="bottomNavLinks right"></div></div>'),
navLnkTpl = _.template('<li class="waves-effect"><a class="navLnk">{{TTL}}</a></li>'),
btnTpl = _.template('<button type="button" id="{{ID}}" class="btn waves-effect">{{TTL}}</button>'),
icnSpn = _.template('<span class="{{CLS}}" title="{{TTL}}"><i class="fa fa-{{ICN}}"></i></span>'),
inpTpl = _.template('<div class="col m6 s12 input-field"><label>{{TTL}}</label><input type="{{TYPE}}" id="{{ID}}" class="input"></div>'),
cusSelectTpl = _.template('<div class="col m6"><select type="select" id="{{ID}}" class="w100 custom-select custom-select-sm"></select></div>'),
collapseTpl = _.template('<div id="{{ID}}" class="collapsible"><li><div class="collapsible-header"><h5>{{TTL}}</h5></div></li></div>'),
submitTpl = _.template('<button type="button" class="btn btn-small mr10 mb10 {{name}}">{{_.startCase(name)}}</button>'),
mdlTpl = _.template('<div id="modal1" class="modal modal-fixed-footer"><div class="modal-content"><h4 id="mdlTitle"></h4><div id="mdlBody"></div></div><div id="mdlFooter" class="modal-footer"><a href="#!" class="modal-close waves-effect waves-light btn-flat">Close</a></div></div>'),
itmTpl = _.template('<div class="col m6"><label class="active">{{key}}</label><input type="text" class="{{key}}" value="{{val}}"></div>'),
itmBaseTpl = _.template('<li class="list-group-item"><div class="collapsible-header"><i class="fa fa-bars"></i><span class="right w100">'+ submitTpl({name:'delete'}) +'</span></div><div class="collapsible-body row"></div></li>')

const opts = {
  nav: ['Background', 'Options', 'Login'],
  main:{
    headerTable:['name', 'value'],
  },
  login:{
    username: 'text',
    email: 'email',
    password: 'password',
    confirm: 'password'
  }
}

//main

function buildMain(){

}

//options
function buildOptNav(){
  $('body').prepend(navTpl()).append(divClsTpl({CLS:'toast disposable fadeOutDown',BODY:''}),bottomNavTpl())
  _.forEach(opts.nav,function(i){
    $('#navLinks').append(navLnkTpl({TTL:i}))
  })

  $('.bottomNavLinks').append('<a class="version"></a>')

  $('.navLnk').off().on('click', function(event) {
    event.preventDefault();
    console.log(_.camelCase(this.text))
    localStorage.setItem('current_url', _.camelCase(this.text))
    location.reload()
  });
}

function logout(){
  $('a.navLnk:last').attr({
    id: 'logout'
  }).text('Logout').off().on('click',function(){
    _.forEach(['user','token'],function(i){
      localStorage.removeItem(i)
    })
    toasty('logout success!')
    reload(1000)
  })
}

//register/Login
function buildLogin(){
  $('#rules-box').append(
    divClsTpl({
      CLS: 'login row',
      BODY: ''
    })
  )
  $('.nav-bottom').addClass('hidden')
  _.forIn(opts.login,function(i,e){
    $('.login').append(inpTpl({TTL:_.startCase(e),TYPE: i,ID:e}))
  })
  $('.login').append(btnTpl({ID: 'loginBtn', TTL: 'submit'}))

  csl.get(function(i){

    if(!i.user){
      toasty('no user detected. please register')
      $('#rules-box h3, title').text('register')
      $('#loginBtn').off().on('click', function() {
        let obj = {},
        stat = false,
        user = $('#username').val(),
        password = $('#password').val(),
        confirm = $('#confirm').val();

        if(!_.eq(password, confirm)){
          return toasty('password does not match confirm')
        }

        _.forEach(['username','email'],function(i){
          let item = $('#' + i).val()
          if(!_.eq(item, '')){
            obj[i] = _.escape(item);
            stat = true;
          } else{
            return stat = false;
          }
        })

        if(!stat){
          return toasty('incomplete register details')
        }

        chrome.system.cpu.getInfo(function(e){
          let salt = crypt.sha512(user + e.archName + e.modelName),
          ver;
          password = forge.util.bytesToHex(forge.pkcs5.pbkdf2(password, salt, 10000, 16))
          obj.email = crypt.sha256(obj.email);
          obj.date = Date.now();
          ver = crypt.gcmEnc(password, 'crypto test pass')

          localStorage.setItem('token', password);
          localStorage.setItem('user', user);
          console.log(obj)
          console.log(crypt.gcmDec(password, ver))
          newUser(obj, ver)
          localStorage.setItem('current_url','')
          return;
        })
      });

      return
    }

    if(_.gte(i.attempts,20)){
      return csl.clear()
    }

    $('#rules-box h3, title').text('Login')

    $('#confirm').parent('div').addClass('hidden')
    $('#loginBtn').off().on('click', function() {
      let obj = {},
      stat = false,
      user = $('#username').val()
      password = $('#password').val(),
      email = $('#email').val();

      _.forEach(['username','email'],function(i){
        let item = $('#' + i).val()
        if(!_.eq(item, '')){
          obj[i] = _.escape(item);
          stat = true;
        } else{
          return stat = false;
        }
      })

      if(!stat){
        csl.set({attempts: i.attempts + 1})
        toasty('incomplete login details')
        return reload(1000)
      }


      if (!_.eq(crypt.sha256(email),i.user.email) || !_.eq(user,i.user.username)) {
        csl.set({attempts: i.attempts + 1})
        toasty('incomplete login details')
        return reload(1000)
      }

        chrome.system.cpu.getInfo(function(e){
          let salt = crypt.sha512(user + e.archName + e.modelName);
          password = forge.util.bytesToHex(forge.pkcs5.pbkdf2(password, salt, 10000, 16))
          if(!_.eq(crypt.gcmDec(password, i.verify),'crypto test pass')) {
            csl.set({attempts: i.attempts + 1});
            toasty('incorrect password');
            return reload(1000);
          }
          csl.set({attempts: 0});
          localStorage.setItem('token', password);
          localStorage.setItem('user', user);
          localStorage.setItem('current_url','');
          //console.log(crypt.gcmDec(password, i.verify))
          toasty('login success!')
          return reload(1000);
        })
    });
    return
  })

}


function buildOptMain(){

  let newItm = ['name','value','id','encrypted']

  $('#rules-box').append(
    divClsTpl({
      CLS: 'main-content row',
      BODY: divClsTpl({
          CLS: 'col s6',
          BODY: submitTpl({name:'commit'}) + submitTpl({name:'newItem'}) + submitTpl({name:'encrypt'}) + submitTpl({name: 'decrypt'}) + submitTpl({name:'import'}) + submitTpl({name:'export'})
        }) + cusSelectTpl({ID:'profileSel'}) + inpTpl({TTL:'url (leave empty for all)',TYPE: 'url',ID:'url'}) + inpTpl({TTL:'comma seperated types  (leave empty for all)',TYPE: 'text',ID:'type'}) + '<ul id="srt" class="list-group col s12 collapsible"></ul><input type="file" id="importSelect" hidden>'
    })
  )

  $('#profileSel').parent('div.col').append(
    $(submitTpl({name:'deleteProfile'})).addClass('mt10'),
    $(submitTpl({name:'newProfile'})).addClass('mt10')
  )



  csl.get(function(i){
      $('#ttl').text('edit');
      $('#profile').text('profile: ' + JSON.stringify(i.profile))
      localStorage.setItem('store',JSON.stringify(i.data[i.profile].store))
      _.forEach(i.data[i.profile].store,function(items,ele){
        $('#srt').append(itmBaseTpl({count:ele,profile:i.profile}))
        _.forIn(items,function(i,e){
          $('#srt').find('.collapsible-body').eq(ele).append(itmTpl({key:e,val:i}))
        })

      })
      _.forEach(i.data,function(i,e){
        $('#profileSel').append('<option value="'+ e +'">profile: '+ e +'</option>')
      })

      $('#type').val(_.join(i.data[i.profile].types,',')).focus().on('keyup', _.debounce(updateType, 1000));
      $('#url').val(i.data[i.profile].url).focus().on('keyup', _.debounce(updateUrl, 1000));

      $('#profileSel option').each(function(e,x){
        if(_.eq(parseInt(x.value),i.profile)) {
          console.log('ok')
          $(x).attr('selected',true)
        }
      })

      $('#profileSel').on('change',function(event) {
        let val = $(this).val()
        if(!_.eq(val,'')){
          changeProfile(val)
        }
      });

      let arr = [],
      obj2 = {},
      data = JSON.parse(localStorage.getItem('store'))
      _.forEach(newItm,function(item){
        $('.' + item).each(function(i, e) {
          $(this).off().on('keyup', function(event) {
            data[i][item] = this.value;
            localStorage.setItem('store',JSON.stringify(data))
          })
        });
      })
      $('.id').attr('readonly',true),
      $('.encrypted').attr('readonly',true)

      $('.commit').on('click', function() {
        commitHead(data)
      });

      $('.newItem').on('click', function() {
        newHeadItem()
      });

      $('.newProfile').on('click', function() {
        newProfile()
      });

      $('.deleteProfile').on('click', function() {
        deleteProfile()
      });

      $('.encrypt').on('click', function() {
        encryptItems()
      });

      $('.decrypt').on('click', function() {
        decryptItems()
      });

      $('#importSelect').off().on('change', function(){
        importItem()
      })
      $('.export').removeClass('mb10').off().on('click', function(){
        exportItem()
      })

      $('.import').on('click', function() {
        $('#importSelect').click()
      })

      $('.delete').off().on('click', function() {
        let item = $(this).parents('.collapsible-header').siblings('.collapsible-body').find('.id').val()
        let res = _.find(data,{id:item})
        deleteHeadItem(res)
      });
      $('.collapsible').collapsible();
      new Sortable(srt, {
        animation: 150,
        onSort: function (evt) {
      	  $('#srt > li').each(function(i,e) {
            $(this).find('.id').val(i + 1)
          });
          $('.id').keyup()
      	}
      });

  })

}
