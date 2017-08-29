$(document).ready(function(){
  //level 1 open nav
  $(".navList .L1").hover(function () {
    $(this).toggleClass("open");
  });

  $(".dd").hover(function (){
    $(this).removeClass("closed");
  }, function(){
    $(this).addClass("closed");
  });

  $(".navList .box").hover(function () {
    $(this).prev().toggleClass("on");
  });


})   

