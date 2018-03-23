import React from 'react';
import { mount } from 'enzyme';
import OlView from 'ol/view';
import OlMap from 'ol/map';
import OlSourceVector from 'ol/source/vector';
import OlLayerVector from 'ol/layer/vector';
import OlExtent from 'ol/extent';
import OlFeature from 'ol/feature';
import OlGeomPoint from 'ol/geom/point';
import OlGeomPolygon from 'ol/geom/polygon';
import OlPointerPointerEvent from 'ol/pointer/pointerevent';
import OlMapBrowserPointerEvent from 'ol/mapbrowserpointerevent';

/**
 * A set of some useful static helper methods.
 *
 * @class
 */
export class TestUtil {

  static mapDivId = 'map';
  static mapDivHeight = 256;
  static mapDivWidth = 256;

  /**
   * Mounts the given component.
   *
   * @param {Component} Component The Component to render.
   * @param {Object} props The props to be used.
   * @param {Object} context The context to be set.
   */
  static mountComponent = (Component, props, context) => {
    const wrapper = mount(<Component {...props} />, {context});
    return wrapper;
  };

  /**
   * Creates and applies a map <div> element to the body.
   *
   * @return {Element} The mounted <div> element.
   */
  static mountMapDiv = () => {
    var div = document.createElement('div');
    var style = div.style;

    style.position = 'absolute';
    style.left = '-1000px';
    style.top = '-1000px';
    style.width = TestUtil.mapDivWidth + 'px';
    style.height = TestUtil.mapDivHeight + 'px';
    div.id = TestUtil.mapDivId;

    document.body.appendChild(div);

    return div;
  };

  /**
   * Removes the map div element from the body.
   */
  static unmountMapDiv = () => {
    let div = document.querySelector(`div#${TestUtil.mapDivId}`);
    if (!div) {
      return;
    }
    let parent = div.parentNode;
    if (parent) {
      parent.removeChild(div);
    }
    div = null;
  };

  /**
   * Creates an ol map.
   *
   * @param {Object} mapOpts Additional options for the map to create.
   * @return {ol.Map} The ol map.
   */
  static createMap = (mapOpts) => {
    let source = new OlSourceVector();
    let layer = new OlLayerVector({source: source});
    let targetDiv = TestUtil.mountMapDiv();
    let defaultMapOpts = {
      target: targetDiv,
      layers: [layer],
      view: new OlView({
        center: [829729, 6708850],
        resolution: 1,
        resolutions: mapOpts ? mapOpts.resolutions : undefined
      })
    };

    Object.assign(defaultMapOpts, mapOpts);

    let map = new OlMap(defaultMapOpts);

    map.renderSync();

    return map;
  };

  /**
   * Removes the map.
   */
  static removeMap = (map) => {
    if (map instanceof OlMap) {
      map.dispose();
    }
    TestUtil.unmountMapDiv();
  };

  /**
   * Simulates a browser pointer event on the map viewport.
   * Origin: https://github.com/openlayers/openlayers/blob/master/test/spec/ol/interaction/draw.test.js#L67
   *
   * @param {ol.Map} map The map to use.
   * @param {string} type Event type.
   * @param {number} x Horizontal offset from map center.
   * @param {number} y Vertical offset from map center.
   * @param {boolean} opt_shiftKey Shift key is pressed
   * @param {boolean} dragging Whether the map is being dragged or not.
   */
  static simulatePointerEvent = (map, type, x, y, opt_shiftKey, dragging) => {
    let viewport = map.getViewport();
    // Calculated in case body has top < 0 (test runner with small window).
    let position = viewport.getBoundingClientRect();
    let shiftKey = opt_shiftKey !== undefined ? opt_shiftKey : false;
    let event = new OlPointerPointerEvent(type, {
      clientX: position.left + x + TestUtil.mapDivWidth / 2,
      clientY: position.top + y + TestUtil.mapDivHeight / 2,
      shiftKey: shiftKey
    });
    map.handleMapBrowserEvent(new OlMapBrowserPointerEvent(type, map, event, dragging));
  }

  /**
   * Creates and returns an empty vector layer.
   *
   * @param {Object} properties The properties to set.
   * @return {ol.layer.Vector} The layer.
   */
  static createVectorLayer = (properties) => {
    let source = new OlSourceVector();
    let layer = new OlLayerVector({source: source});

    layer.setProperties(properties);

    return layer;
  }

  /**
   * Returns a point feature with a random position.
   * @type {Object}
   */
  static generatePointFeature = ((props = {
    ATTR_1: Math.random() * 100,
    ATTR_2: 'Borsigplatz 9',
    ATTR_3: 'Dortmund'
  }) => {
    const coords = [
      Math.floor(Math.random() * 180) - 180,
      Math.floor(Math.random() * 90) - 90
    ];
    const geom = new OlGeomPoint(coords);
    const feat = new OlFeature({
      geometry: geom
    });

    feat.setProperties(props);

    return feat;
  })

  /**
   * Returns a polygon feature with a random position.
   * @type {Object}
   */
  static generatePolygonGeometry = (vertices = 4) => {
    const polyCoords = [];
    for (let i = 0; i <= vertices; i++){
      const coords = [
        Math.floor(Math.random() * 180) - 180,
        Math.floor(Math.random() * 90) - 90
      ];
      polyCoords.push(coords);
    }
    const extent = OlExtent.boundingExtent(polyCoords);
    const geom = new OlGeomPolygon.fromExtent(extent); 
    return geom;
  }

  /**
   * Returns a random extent .
   * @type {array}
   */
  static generateExtent = () => {
    const polyCoords = [];
    for (let i = 0; i < 5; i++){
      const coords = [
        Math.floor(Math.random() * 180) - 180,
        Math.floor(Math.random() * 90) - 90
      ];
      polyCoords.push(coords);
    }
    const extent = OlExtent.boundingExtent(polyCoords);
    return extent;
  }
}

export default TestUtil;
