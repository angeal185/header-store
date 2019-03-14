

$(document).ready(function () {

  buildOptNav()

  $('nav:first').after(optBaseTpl())

  _.forEach(['token','user'],function(i){
    if(!localStorage.getItem(i) || _.eq(localStorage.getItem(i), '')) {
      localStorage.setItem('current_url','login')
    }
  })

  if  (!_.eq(localStorage.getItem('current_url'),'login')){
    buildOptMain()
    logout()
  } else {
    buildLogin()
  }
  $('.version').text('V'+ getVersion())
  $('.navLnk').eq(1).click(function(event) {
    //chrome.runtime.getURL('/_generated_background_page.html')
  /*  chrome.runtime.getBackgroundPage(function(i,e){
      console.log(e)
    })
    */
    location.href = '/_generated_background_page.html';
  });
});


chrome.runtime.getBackgroundPage(function(i,e){
  console.log(i)
})
