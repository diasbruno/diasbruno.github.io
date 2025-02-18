function noop() {}

function segmentUri(uri) {
  return uri.slice(1).split('/').filter(x => !!x);
}

function route(uri, enter = noop, update = noop, exit = noop) {
  return {
    path: uri,
    segments: segmentUri(uri),
    enter,
    update,
    exit
  };
}

const emptyURI = "";

function wildcardRoute(enter = noop, update = noop, exit = noop) {
  return route(emptyURI, enter, update, exit);
}

function match(segments, uri) {
  const uriSegments = segmentUri(uri);
  if (segments.length !== uriSegments.length) {
    return [false, []];
  }

  const params = {};
  for (let x = 0; x < segments.length; x++) {
    let param = segments[x][0] === ':';
    let segment = param ? segments[x].slice(1) : segments[x];

    if (param) {
      params[segment] = uriSegments[x];
    } else if (segment !== uriSegments[x]) {
      return [false, []];
    }
  }
  return [true, params];
}

function matchRoute(routes, uri, wildcard) {
  for (let route of routes) {
    const [matched, params] = match(route.segments, uri);
    if (matched) {
      return [route, params];
    }
  }
  return wildcard ? [wildcard, {}] : [];
}

const ENTER = 0;
const UPDATE = 3;
const EXIT = 1;

function router(wildcard, ...routes) {
  let currentRoute = null;
  let currentParams = null;

  return function (uri) {
    const [route, params] = matchRoute(routes, uri, wildcard);
    let state = +(Boolean(currentRoute)) +
      (+(Boolean(currentRoute && currentRoute.path === route.path)) * 2);
    switch (state) {
      case EXIT: (
        currentRoute && currentRoute.exit(currentParams),
        currentRoute = null,
        currentParams = null
      );
      case ENTER: return (
        route.enter(params),
        currentRoute = route,
        currentParams = params,
        null
      );
      case UPDATE: currentRoute.update(currentParams);
    }
  };
}

export { router, route, wildcardRoute };
