import $$ from 'slot';
import virtualDom from 'virtual-dom';
var h = virtualDom.h;

class Scrollable {
  constructor({
    tag='div',
    $$content,
  }) {
    this.$$content = $$content;
    this.tag = tag;
    this.$$height = $$(1, 'height');
    this.$$contentHeight = $$(1, 'content-height');
    this.$$top = $$(0, 'top');
    this.$$grabbing = $$(false, 'grabbing');
  }
  get $$view() {
    let scrollable = this;
    return $$.connect(
      [this.$$content, this.$$height,
        this.$$contentHeight, this.$$top, this.$$grabbing],
      function ([content, height, contentHeight, top, grabbing]) {
        var withScrollbar = height < contentHeight;
        return h(function () {
          let s = scrollable.tag + '.scrollable';
          if (withScrollbar) {
            s += '.with-scrollbar';
          }
          return s;
        }(), {
          hook: new class Hook {
            hook(el) {
              scrollable.el = el;
              setTimeout(function () {
                scrollable.setupLayout();
              }, 0);
            }
          },
        }, [
          h('.container', {
            style: {
              top: -top * contentHeight + 'px',
            },
            onwheel(e) {
              if (height >= contentHeight) {
                return false;
              }
              let top = ((scrollable.$$top.val() * contentHeight + e.deltaY / 2)
              / contentHeight);
              if (top < 0) {
                top = 0;
              }
              if (top * contentHeight + height >= contentHeight) {
                top = (contentHeight - height) / contentHeight;
              }
              scrollable.$$top.val(top);
              return false;
            }
          }, content),
          h(
            function () {
              let s = '.scrollbar.vertical';
              if (height >= contentHeight) {
                s += '.hidden';
              }
              if (grabbing) {
                s += '.grabbing';
              }
              return s;
            }(),
            h('.bar', {
              onmousedown(e) {
                scrollable.$$grabbing.val(true);
                let lastY = e.clientY;
                let onmouseup = function () {
                  scrollable.$$grabbing.val(false);
                  document.removeEventListener('mouseup', onmouseup);
                  document.removeEventListener('mousemove', onmousemove);
                };
                let onmousemove = function (e) {
                  top = (top * height + e.clientY - lastY) / height;
                  lastY = e.clientY;
                  if (top < 0) {
                    top = 0;
                  }
                  if (top * contentHeight + height >= contentHeight) {
                    top = (contentHeight - height) / contentHeight;
                  }
                  scrollable.$$top.val(top);
                };
                document.addEventListener('mouseup', onmouseup);
                document.addEventListener('mousemove', onmousemove);
              },
              style: {
                top: top * 100 + '%',
                height: height / contentHeight * 100 + '%',
              }
            })),
        ]);
      });
  }
  setupLayout() {
    $$.update([
      [this.$$height, this.el.offsetHeight],
      [this.$$contentHeight, this.el.querySelector('.container').offsetHeight]
    ]);
  }
}

export default Scrollable;
