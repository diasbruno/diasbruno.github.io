import Two from './two.js';
import { Tween, Easing, Group } from "./tween.js";
import { parseISO, format } from './datefn.js';
import { createHashHistory } from './history.js';
import { wildcardRoute, route, router } from "./router.js";

let history = createHashHistory();

function noop() {}

const routes = [
  route(
    "/",
    function () {
      pageStack.push(HomePage());
    },
    function () {
      pageStack.shift();
      pageStack[0].start();
    },
    Transition1In
  ),
  route(
    "/blog/:y/:m/:d/:article",
    function (params) {
      pageStack.push(PostPage(params));
    },
    function () {
      pageStack.shift();
      pageStack[0].start();
    },
    Transition1In
  ),
  route(
    "/blog",
    function () {
      pageStack.push(BlogPage());
    },
    function () {
      pageStack.shift();
      pageStack[0].start();
    },
    Transition1In
  )
];

const appRouter = router(
  wildcardRoute(noop, noop, noop),
  ...routes
);

const resize = 'resize';
const width = 'width';
const height = 'height';

function appendTo(target, element) {
  target.appendChild(element);
}

function appendManyTo(target, elements) {
  elements.forEach(element => appendTo(target, element));
}

function screenWidth(percent = 1) {
  return window.innerWidth * percent;
}

function screenHeight(percent = 1) {
  return window.innerHeight * percent;
}

function styleValue(target, prop, percent = 1) {
  return parseFloat(target.style[prop].replace('px|%', '')) * percent;
}

function selector(tag) {
  return document.querySelector(tag);
}

function selectorAll(tag) {
  return document.querySelectorAll(tag);
}

let virtualPoint = new Two.Vector(
  screenWidth(0.5), screenHeight(0.5)
);

const frame = document.body;
const logo = 150;

const pagesCache = {};
let posts = [];
const animationStack = {};

let scene;
let pageStack = [];

function centerToScreen(target) {
  target.style.left = screenWidth(0.5) - styleValue(target, width, 0.5);
  target.style.top = screenHeight(0.5) - styleValue(target, height, 0.5);
}

const applyStyles = (target, styles) => {
  for (let [name, value] of Object.entries(styles)) {
    target.style[name] = value;
  }
};

const create = (tag, className = "", styles = {}) => {
  const $element = document.createElement(tag);
  applyStyles($element, styles);
  className && ($element.className = className);
  return $element;
};

function Layer() {
  let elements = {};
  let count = 0;
  function layerId() {
    ++count;
    return `layer-element-${count}`;
  }
  return {
    create(tag, className = "", styles = {}) {
      const layerElementId = layerId();
      const $element = create(
        tag,
        `${layerElementId} ${className}`,
        styles
      );
      $element.dataset["layerElement"] = count.toString();
      elements[layerElementId] = $element;
      return $element;
    },
    removeAll() {
      for (let [_, $element] of Object.entries(elements)) {
        this.remove($element);
      }
      elements = {};
    },
    remove($element) {
      const count = $element.dataset["layerElement"];
      delete elements[`layer-element-${count}`];
      $element.parentNode.removeChild($element);
    }
  };
}

function createNavigationLink(scene, name, navigate) {
  const $categoryLink = scene.create("a", "red", {
    fontSize: "1.6rem"
  });
  const $category = scene.create("h5");
  $categoryLink.href = "#";
  $category.innerHTML = name;
  $categoryLink.onclick = navigate;
  appendTo($categoryLink, $category);
  return $categoryLink;
}

function PageNavigation(scene, links) {
  const $header = scene.create("nav", "", {
    display: "flex",
    alignItems: "baseline",
    opacity: 0
  });

  const count = (links.length * 2) - 1;

  const all = [];

  for (let x = 0; x < count; ++x) {
    if (x % 2 == 0) {
      const [name, navigate] = links[x == 0 ? x : x - 1];
      all.push(createNavigationLink(scene, name, navigate));
    } else {
      const $navigationSeparator = scene.create("h5", "red", {
        margin: "0 1.2rem"
      });
      $navigationSeparator.innerHTML = "/";
      all.push($navigationSeparator);
    }
  }

  appendManyTo($header, all);

  return $header;
}

function HomePage() {
  return {
    start() {
      scene = Layer();
      const rect = new Two.Vector(200, 180);

      const container = scene.create("div", "", {
        position: "relative",
        left: `${virtualPoint.x - rect.x}px`,
        top: `${virtualPoint.y - rect.y}px`,
        width: `${rect.x * 2}px`,
        height: `${rect.y * 2}px`
      });
      frame.appendChild(container);

      function resizeHandler() {
        virtualPoint = new Two.Vector(
          screenWidth(0.5), screenHeight(0.5)
        );

        applyStyles(container, {
          left: `${virtualPoint.x - rect.x}px`,
          top: `${virtualPoint.y - rect.y}px`,
        });
      }

      window.addEventListener(resize, resizeHandler);

      var two = new Two({
        type: Two.Types.svg,
        width: logo,
        height: logo,
      }).appendTo(container);

      two.renderer.domElement.style.background = 'rgb(32, 32, 32)';

      const svg = document.querySelector('svg#svg1');
      const logoSvg = two.interpret(svg);
      two.add(logoSvg);
      two.scene.scale = 3;
      two.scene.position.set(two.width * 0.5, two.height * 0.5);

      logoSvg.ending = 0;
      logoSvg.subdivide();
      logoSvg.noFill();
      logoSvg.center();
      logoSvg.stroke = '#fff';

      function Scene3() {
        const $menu = scene.create("nav", "", {
          position: "absolute",
          left: "50%",
          top: `calc(${rect.y}px - 70px)`,
          width: "200px",
          height: "140px",
          overflow: "hidden"
        });
        const sty = {
          position: "relative",
          left: "-200px",
        };

        const $blog = scene.create("a", "red", sty);
        $blog.href = "/blog";
        $blog.innerHTML = "BLOG";
        $blog.onclick = function (event) {
          event.preventDefault();
          history.push("/blog");
        };
        const $github = scene.create("a", "yellow", sty);
        $github.href = "http://github.com/diasbruno";
        $github.target = "_blank";
        $github.innerHTML = "GITHUB";
        const $linkedin = scene.create("a", "blue", sty);
        $linkedin.href = "https://www.linkedin.com/in/brunodiash/";
        $linkedin.innerHTML = "LINKEDIN";
        $linkedin.target = "_blank";

        appendManyTo($menu, [$blog, $github, $linkedin]);

        const group = new Group();
        new Tween({ left: -200 }, group).
          easing(Easing.Bounce.In).
          to({ left: 40 }, 400).
          onUpdate((p) => {
            $blog.style.left = `${p.left}px`;
          }).start();
        new Tween({ left: -200 }, group).
          easing(Easing.Bounce.In).
          to({ left: 40 }, 500).
          delay(100).onUpdate((p) => {
            $github.style.left = `${p.left}px`;
          }).start();
        new Tween({ left: -200 }, group).
          easing(Easing.Bounce.In).
          to({ left: 40 }, 600).
          delay(200).onUpdate((p) => {
            $linkedin.style.left = `${p.left}px`;
          }).start();

        animationStack["Scene3"] = group;

        group.onComplete(() => {
          delete animationStack["Scene3"];
        });

        container.appendChild($menu);
      }

      function Scene2() {
        const $line = scene.create("div", "", {
          position: "absolute",
          left: `${rect.x}px`,
          width: "1px",
          height: "0",
          backgroundColor: "#fff"
        });
        container.appendChild($line);

        const $renderer = two.renderer.domElement;
        const left = styleValue($renderer, 'left');
        const group = new Group();

        const tween = new Tween({ top: 0, height: 0 }, group)
          .to({ top: rect.y * 0.5, height: rect.y }, 350)
          .easing(Easing.Quadratic.InOut)
          .onUpdate(({ top, height }) => {
            $line.style.top = `${rect.y - top}px`;
            $line.style.height = `${height}px`;
          });
        const tween2 = new Tween({ left }, group)
          .to({ left: rect.x - logo }, 200)
          .easing(Easing.Quadratic.In)
          .onUpdate(({ left }) => {
            two.renderer.domElement.style.left = `${left}px`;
          })
        tween.start();
        tween2.start();
        group.onComplete(() => {
          delete animationStack["Scene2"];
          Scene3();
        });
        animationStack["Scene2"] = group;
      }

      function Scene1() {
        applyStyles(
          frame, {
          position: "relative",
          height: "100vh",
          margin: "0"
        }
        );

        applyStyles(two.renderer.domElement, {
          position: "absolute",
          left: `${rect.x - logo * 0.5}px`,
          top: `${rect.y - logo * 0.5}px`
        });

        const tween = new Tween({ frame: 0 }, false)
          .to({ frame: 1 }, 2000)
          .easing(Easing.Quadratic.InOut)
          .onUpdate((self) => {
            logoSvg.ending = self.frame;
          })
          .onComplete(() => {
            delete animationStack["Scene1"];
            Scene2();
          })
          .start();
        animationStack["Scene1"] = tween;
      }

      two.play();
      Scene1();
    }
  }
}

function BlogPage() {
  return {
    start() {
      scene = Layer();

      const container = scene.create("div", "", {
        width: "70%",
        margin: "0 auto"
      });

      frame.appendChild(container);

      function createPostListItem(post) {
        const $postListItemView = scene.create("div");
        const $titleView = scene.create("div", "article-item");
        const $titleLink = scene.create("a", "red");
        const date = parseISO(post.date);
        const postURL = `/blog/${format(date, "yyyy/MM/dd")}/${post.slug}`;
        $titleLink.href = `/#${postURL}`;
        $titleLink.onclick = function (event) {
          event.preventDefault();
          history.push(postURL);
        };
        const $title = scene.create("h2", "article-title");
        $title.innerHTML = post.title;

        const $time = scene.create("time", "content-datetime");
        $time.innerHTML = post.date;

        appendTo($titleLink, $title);
        appendTo($titleView, $titleLink);
        appendManyTo($postListItemView, [$titleView, $time]);

        return $postListItemView;
      }

      function Scene3() {
        posts.forEach(post => {
          const $postListItem = createPostListItem(post);
          appendTo(container, $postListItem);
        })
      }

      function Scene2() {
        const $loading = scene.create("div", "loading", {
          position: "absolute",
          width: "200px",
          height: "50px",
          textAlign: "center"
        });

        $loading.innerHTML = "LOADING...";
        centerToScreen($loading);

        frame.appendChild($loading);

        fetch("/posts-1.json").then(
          response => response.json()
        ).then(
          data => (pagesCache[data.page] = data, posts = posts.concat(data.content), posts)
        ).then(
          posts => (scene.remove($loading), Scene3())
        );
      }

      function Scene1() {
        const $header = PageNavigation(scene, [
          ["&larr; HOME", function (event) {
            event.preventDefault();
            history.push("/");
          }]
        ]);

        container.appendChild($header);

        const $title = scene.create("h1", "red", {
          fontSize: "4.2rem",
          opacity: 0
        });
        $title.innerHTML = "BLOG";

        container.appendChild($title);

        const group = new Group();

        new Tween({ opacity: 0 }, group).
          to({ opacity: 1 }, 300).
          easing(Easing.Quadratic.InOut).
          onUpdate((p) => {
            applyStyles($header, { opacity: p.opacity });
          }).start();

        new Tween({ opacity: 0 }, group).
          to({ opacity: 100 }, 600).
          delay(300).
          easing(Easing.Quadratic.InOut).
          onUpdate((p) => {
            applyStyles($title, { opacity: `${p.opacity}%` });
          }).start();

        animationStack["Scene1"] = group;

        group.onComplete(() => {
          delete animationStack["Scene1"];
          Scene2()
        });
      }

      Scene1();
    }
  };
}

function PostPage(params) {
  return {
    start() {
      scene = Layer();
      let post;
      let { y, m, d, article } = params;

      const container = scene.create("div", "", {
        width: "70%",
        margin: "0 auto"
      });

      let text = "";

      frame.appendChild(container);

      function Scene2() {
        const $header = PageNavigation(scene, [
          ["&larr; HOME", function (event) {
            event.preventDefault();
            history.push("/");
          }],
          ["BLOG", function (event) {
            event.preventDefault();
            history.push("/blog");
          }]
        ]);

        appendTo(container, $header);

        const $title = scene.create("h1", "article-title red", {
          backgroundColor: "var(--red-muted)",
          color: "var(--background)",
          padding: "2rem",
          width: 0
        });

        const $text = scene.create("div", "article-content", {
          opacity: 0
        });
        $text.innerHTML = text;

        appendManyTo(container, [$title, $text]);

        const group = new Group();

        new Tween({ opacity: 0 }, group).
          to({ opacity: 1 }, 300).
          easing(Easing.Quadratic.InOut).
          onUpdate((p) => {
            applyStyles($header, { opacity: p.opacity });
          }).onComplete(
            () => {
              $title.innerHTML = post.title;
            }
          ).start();

        new Tween({ width: 0 }, group).
          to({ width: 100 }, 300).
          delay(300).
          easing(Easing.Quadratic.InOut).
          onUpdate((p) => {
            applyStyles($title, { width: `${p.width}%` });
          }).start();

        new Tween({ opacity: 0 }, group).
          to({ opacity: 1 }, 300).
          delay(600).
          easing(Easing.Quadratic.InOut).
          onUpdate((p) => {
            applyStyles($text, { opacity: p.opacity });
          }).start();

        animationStack["Scene2"] = group;

        group.onComplete(() => {
          delete animationStack["Scene2"];
          hljs.initHighlighting();
        });
      }

      function Scene1() {
        const $loading = scene.create("div", "loading", {
          position: "absolute",
          width: "200px",
          height: "50px",
          textAlign: "center"
        });

        $loading.innerHTML = "LOADING...";
        centerToScreen($loading);

        frame.appendChild($loading);

        const baseURL = `/${y}-${m}-${d}-${article}`;

        Promise.all([
          fetch(`${baseURL}.json`).then(
            response => response.json()
          ),
          fetch(`${baseURL}.html`).then(
            response => response.text()
          )
        ])
        .then(
          ([metadata, content]) => (post = metadata, text = content)
        ).finally(
          posts => (scene.remove($loading), Scene2())
        );
      }

      Scene1();
    }
  };
}


function Transition1Out() {
  const $elements = [
    "bblue", "bpink", "bgreen", "byellow", "borange", "bred", "bpurple"
  ].map(color => document.querySelector(`.${color}`));

  const group = new Group();

  $elements.forEach(($element, index) => {
    new Tween({ top: 0, height: 100 }, group).
      to({ top: 100, height: 0 }, 1000).
      delay(50 * index).
      easing(Easing.Quadratic.In).
      onUpdate(({ top, height }) => {
        $element.style.top = `${top}%`;
        $element.style.height = `${height}vh`;
      }).start();
  });

  animationStack["Transition1Out"] = group;

  group.onComplete(function () {
    delete animationStack["Transition1Out"];
    scene.removeAll();
    appRouter(currentURI());
  });
}

function Transition1In() {
  const each = screenWidth() / 7;

  const layer = Layer();

  function createItem(color, index) {
    return layer.create("div", color, {
      position: "fixed",
      top: 0,
      left: `${index * each}px`,
      width: `${each}px`,
      height: "0"
    });
  }
  const $elements = [
    "bblue", "bpink", "bgreen", "byellow", "borange", "bred", "bpurple"
  ].map(createItem);

  const group = new Group();

  $elements.forEach(($element, index) => {
    frame.appendChild($element);
    new Tween({ height: 0 }, group).
      to({ height: 100 }, 1000).
      delay(50 * index).
      easing(Easing.Quadratic.In).
      onUpdate(({ height }) => {
        $element.style.height = `${height}vh`;
      }).start();
  });

  animationStack["Transition1In"] = group;

  group.onComplete(function () {
    delete animationStack["Transition1In"];
    scene.removeAll();
    scene = layer;
    Transition1Out();
  });
}

function d() {
  Object.values(animationStack).forEach(
    animation => animation.update()
  );
  requestAnimationFrame(d);
}

function currentURI() {
  return location.hash.replace('#', '')
}

(function main() {
  history.listen(
    ({ location }) => appRouter(location.pathname)
  );

  appRouter(currentURI());
  pageStack[0].start();

  requestAnimationFrame(d);
})();
