// Hamburger Function
function hamburgerPhone() {
  var menu = document.getElementsByClassName("topmenu")[0];
  if (menu.style.display === "flex") {
    menu.style.display = "none";
  } else {
    menu.style.display = "flex";
  }
}
//Hamburger More function
function morePhone() {
  var menu = document.getElementsByClassName("topmenu-more")[0];
  if (menu.style.display === "flex") {
    menu.style.display = "none";
  } else {
    menu.style.display = "flex";
  }
}
function moreDesktop() {
  var menu = document.getElementsByClassName("onlyfordesktop-more")[0];
  if (menu.style.display === "flex") {
    menu.style.display = "none";
  } else {
    menu.style.display = "flex";
  }
}

//Theme phone
function toggleCSS() {
  var styleLink = document.querySelector('link[href="/styles/style-dark.css"]');

  if (styleLink) {
    styleLink.remove();
  } else {
    styleLink = document.createElement('link');
    styleLink.rel = 'stylesheet';
    styleLink.type = 'text/css';
    styleLink.href = '/styles/style-dark.css';

    document.head.appendChild(styleLink);
  }
}

var toggleLink = document.getElementById("toggleLink");

if (toggleLink) {
  toggleLink.addEventListener("click", function(event) {
    event.preventDefault(); // This prevents the default behavior (scrolling to the top)
    toggleCSS();
  });
}


//scroll

function handleScroll(elementClass, scrollThreshold) {
 var menu = document.querySelector('.' + elementClass);

 window.addEventListener('scroll', function() {
  if (document.documentElement.scrollTop > scrollThreshold) {
   menu.classList.add(elementClass + '-scroll');
  } else {
   menu.classList.remove(elementClass + '-scroll');
  }
 });
}
// Usage
handleScroll('topbar', 200);
handleScroll('topline', 200);
handleScroll('topmenu', 200);
handleScroll('onlyfordesktop-more', 200)