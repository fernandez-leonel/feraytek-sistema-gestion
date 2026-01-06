(function(){
  function Footer(){
    const year = 2025;
    return React.createElement("footer",{className:"site-footer"},
      React.createElement("div",{className:"footer-wrap"},
        React.createElement("div",{className:"footer-grid"},
          React.createElement("div",{className:"footer-brand"},
            React.createElement("img",{className:"footer-logo",src:"/img/logo1.jpeg",alt:"Feraytek"}),
            React.createElement("span",{className:"footer-title"},"Feraytek")
          ),
          React.createElement("div",{className:"footer-contact"},
            React.createElement("div",{className:"contact-row"},
              React.createElement("div",{className:"contact-item"},
                React.createElement("svg",{className:"contact-ico",viewBox:"0 0 24 24",fill:"currentColor"},React.createElement("path",{d:"M6 2l4 2-1 3-2 2a12 12 0 006 6l2-2 3 1-2 4c-6 1-14-7-14-14z"})),
                React.createElement("a",{href:"tel:+543777203290029"},"+54 3777 203290029")
              ),
              React.createElement("div",{className:"contact-item"},
                React.createElement("svg",{className:"contact-ico",viewBox:"0 0 24 24",fill:"currentColor"},React.createElement("path",{d:"M12 2a10 10 0 100 20 10 10 0 000-20zm0 4l7 4-7 4-7-4 7-4zm-7 8l7 4 7-4-7 2-7-2z"})),
                React.createElement("span",null,"España 831, Goya, Corrientes, Argentina")
              ),
              React.createElement("div",{className:"contact-item"},
                React.createElement("svg",{className:"contact-ico",viewBox:"0 0 24 24",fill:"currentColor"},React.createElement("path",{d:"M20 4H4a2 2 0 00-2 2v12a2 2 0 002 2h16a2 2 0 002-2V6a2 2 0 00-2-2zm-1.5 4L12 12.5 5.5 8H18.5z"})),
                React.createElement("a",{href:"mailto:feraytek@gmail.com"},"feraytek@gmail.com")
              )
            )
          ),
          React.createElement("div",{className:"footer-actions"},
            React.createElement("div",{className:"social-row"},
              React.createElement("a",{className:"social-btn whatsapp",href:"https://wa.me/543777203290029",target:"_blank",rel:"noopener",title:"WhatsApp","aria-label":"WhatsApp"},
                React.createElement("svg",{className:"ico",viewBox:"0 0 24 24",fill:"currentColor"},React.createElement("path",{d:"M12 2a10 10 0 100 20 10 10 0 000-20zm.1 5.4c1.4 0 2.6.5 3.6 1.5a5 5 0 011.5 3.6c0 1.4-.5 2.6-1.5 3.6a5 5 0 01-3.6 1.5c-1.4 0-2.6-.5-3.6-1.5A5 5 0 016 12.5c0-1.4.5-2.6 1.5-3.6a5 5 0 014.6-1.5zm-2.4 3.8c.2.5 1 1.6 2.3 2.3 1.3.7 2.2.7 2.7.6.4-.1 1.4-.6 1.6-1.2.2-.6.2-1.2 0-1.4-.1-.2-.4-.3-.8-.5-.4-.1-.7-.3-.9.1-.2.4-.4.8-.6.9-.2.1-.5.1-1-.2-.6-.3-1.5-1.2-1.8-1.7-.3-.5-.3-.8-.2-1 .1-.1.2-.3.3-.5.1-.2 0-.4 0-.6s-.5-.6-.8-.6c-.3 0-.7 0-1 .4-.3.4-.6 1.1-.6 1.7 0 .6.3 1.2.8 2z"}))
              ),
              React.createElement("a",{className:"social-btn facebook",href:"https://facebook.com/",target:"_blank",rel:"noopener",title:"Facebook","aria-label":"Facebook"},
                React.createElement("svg",{className:"ico",viewBox:"0 0 24 24",fill:"currentColor"},React.createElement("path",{d:"M22 12a10 10 0 10-12 9.9v-7h-3v-3h3V9.5c0-2.2 1.2-3.4 3.3-3.4.9 0 1.8.2 1.8.2v2h-1c-1 0-1.3.6-1.3 1.2V12h2.3l-.3 3h-2v7A10 10 0 0022 12z"}))
              ),
              React.createElement("a",{className:"social-btn x",href:"https://twitter.com/",target:"_blank",rel:"noopener",title:"X","aria-label":"X"},
                React.createElement("svg",{className:"ico",viewBox:"0 0 24 24",fill:"currentColor"},React.createElement("path",{d:"M17.6 3H21l-7.2 8.2L21.8 21H18l-6-7.1L6 21H2.4l7.6-8.7L2.2 3H6l5.7 6.8L17.6 3z"}))
              ),
              React.createElement("a",{className:"social-btn instagram",href:"https://instagram.com/",target:"_blank",rel:"noopener",title:"Instagram","aria-label":"Instagram"},
                React.createElement("svg",{className:"ico",viewBox:"0 0 24 24",fill:"currentColor"},React.createElement("path",{d:"M7 2h10a5 5 0 015 5v10a5 5 0 01-5 5H7a5 5 0 01-5-5V7a5 5 0 015-5zm5 5a5 5 0 100 10 5 5 0 000-10zm6.5-1.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z"}))
              ),
              React.createElement("a",{className:"social-btn tiktok",href:"https://www.tiktok.com/",target:"_blank",rel:"noopener",title:"TikTok","aria-label":"TikTok"},
                React.createElement("svg",{className:"ico",viewBox:"0 0 24 24",fill:"currentColor"},React.createElement("path",{d:"M15 3c1.3 2.5 3.3 3.9 6 4.2v3c-2.2-.2-3.9-1-6-2.6v6.8a5.5 5.5 0 11-3.8-5.3v3a2.5 2.5 0 102.5 2.5V3z"}))
              ),
              React.createElement("a",{className:"social-btn youtube",href:"https://youtube.com/",target:"_blank",rel:"noopener",title:"YouTube","aria-label":"YouTube"},
                React.createElement("svg",{className:"ico",viewBox:"0 0 24 24",fill:"currentColor"},React.createElement("path",{d:"M23 7.5a4 4 0 00-2.8-2.8C18.5 4 12 4 12 4s-6.5 0-8.2.7A4 4 0 001 7.5 41 41 0 001 12a41 41 0 000 4.5 4 4 0 002.8 2.8C5.5 20 12 20 12 20s6.5 0 8.2-.7A4 4 0 0023 16.5 41 41 0 0023 12a41 41 0 000-4.5zM10 15l5-3-5-3v6z"}))
              )
            ),
            React.createElement("a",{className:"footer-link near-social",href:"#support"},"Soporte")
          )
        ),
        React.createElement("div",{className:"footer-note"},`Feraytek — ${year} · Derechos reservados`)
      )
    );
  }
  window.Feraytek = window.Feraytek || {};
  window.Feraytek.Footer = Footer;
})();
