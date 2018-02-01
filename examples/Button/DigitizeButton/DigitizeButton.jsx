import React from 'react';
import PropTypes from 'prop-types';

import { Modal, Input } from 'antd';

import OlMap from 'ol/map';
import OlLayerVector from 'ol/layer/vector';
import OlSourceVector from 'ol/source/vector';
import OlCollection from 'ol/collection';
import OlStyleStyle from 'ol/style/style';
import OlStyleStroke from 'ol/style/stroke';
import OlStyleFill from 'ol/style/fill';
import OlStyleCircle from 'ol/style/circle';
import OlStyleText from 'ol/style/text';
import OlInteractionDraw from 'ol/interaction/draw';
import OlInteractionSelect from 'ol/interaction/select';
import OlInteractionModify from 'ol/interaction/modify';
import OlInteractionTranslate from 'ol/interaction/translate';
import OlEventsCondition from 'ol/events/condition';

import ToggleButton from '../ToggleButton/ToggleButton.jsx';
import MapUtil from '../../Util/MapUtil/MapUtil';
import StringUtil from '../../Util/StringUtil/StringUtil';
import AnimateUtil from '../../Util/AnimateUtil/AnimateUtil';
import Logger from '../../Util/Logger';

import './DigitizeButton.less';

/**
 * The DigitizeButton.
 *
 * @class The DigitizeButton
 * @extends React.Component
 *
 */
class DigitizeButton extends React.Component {

  /**
   * The className added to this component.
   *
   * @type {String}
   * @private
   */
  className = 'react-geo-digitizebutton';

  /**
   * Currently existing digitize features as collection.
   *
   * @type {OlCollection}
   * @private
   */
  _digitizeFeatures = null;

  /**
   * Currently drawn feature which should be represent as label or postit.
   * @type {OlFeature}
   * @private
   */
  _digitizeTextFeature = null;

  /**
   * Reference to OL select interaction which will be used in edit mode.
   * @type {OlInteractionSelect}
   * @private
   */
  _selectInteraction = null;

  /**
   * Name of point draw type.
   * @private
   */
  static POINT_DRAW_TYPE = 'Point';

  /**
   * Name of line string draw type.
   * @private
   */
  static LINESTRING_DRAW_TYPE = 'LineString';

  /**
   * Name of polygon draw type.
   * @private
   */
  static POLYGON_DRAW_TYPE = 'Polygon';

  /**
   * Name of circle draw type.
   * @private
   */
  static CIRCLE_DRAW_TYPE = 'Circle';

  /**
   * Name of rectangle draw type.
   * @private
   */
  static RECTANGLE_DRAW_TYPE = 'Rectangle';

  /**
   * Name of text draw type.
   * @private
   */
  static TEXT_DRAW_TYPE = 'Text';

  /**
   * Name of copy edit type.
   * @private
   */
  static COPY_EDIT_TYPE = 'Copy';

  /**
   * Name of edit edit type.
   * @private
   */
  static EDIT_EDIT_TYPE = 'Edit';

  /**
   * Name of delete edit type.
   * @private
   */
  static DELETE_EDIT_TYPE = 'Delete';

  /**
   * The properties.
   * @type {Object}
   */
  static propTypes = {
    /**
     * The className which should be added.
     *
     * @type {String}
     */
    className: PropTypes.string,

    /**
     * Instance of OL map this component is bound to.
     *
     * @type {OlMap}
     */
    map: PropTypes.instanceOf(OlMap).isRequired,

    /**
     * Whether the line, point, polygon, circle, rectangle or text shape should
     * be drawn.
     *
     * @type {String}
     */
    drawType: PropTypes.oneOf(['Point', 'LineString', 'Polygon', 'Circle', 'Rectangle', 'Text']),

    /**
     * Whether the digitize feature should be deleted, copied or modified.
     * be drawn.
     *
     * @type {String}
     */
    editType: PropTypes.oneOf(['Copy', 'Edit', 'Delete']),

    /**
     * Name of system vector layer which will be used for digitize features.
     *
     * @type {String}
     */
    digitizeLayerName: PropTypes.string,

    /**
     * Fill color of the digitize feature.
     *
     * @type {String}
     */
    fillColor: PropTypes.string,

    /**
     * Stroke color of the digitize feature.
     *
     * @type {String}
     */
    strokeColor: PropTypes.string,

    /**
     * Fill color of selected digitize feature.
     *
     * @type {String}
     */
    selectFillColor: PropTypes.string,

    /**
     * Stroke color of selected digitize feature.
     *
     * @type {String}
     */
    selectStrokeColor: PropTypes.string,

    /**
     * Title for modal used for input of labels for digitize features.
     *
     * @type {String}
     */
    modalPromptTitle: PropTypes.string,

    /**
     * Text string for `OK` button of the modal.
     *
     * @type {String}
     */
    modalPromptOkButtonText: PropTypes.string,

    /**
     * Text string for `Cancel` button of the modal.
     *
     * @type {String}
     */
    modalPromptCancelButtonText: PropTypes.string
  };


  /**
   * The default properties.
   * @type {Object}
   */
  static defaultProps = {
    digitizeLayerName: 'react-geo_digitize',
    fillColor: 'rgba(154, 26, 56, 0.5)',
    strokeColor: 'rgba(154, 26, 56, 0.8)',
    selectFillColor: 'rgba(240, 240, 90, 0.5)',
    selectStrokeColor: 'rgba(220, 120, 20, 0.8)',
    modalPromptTitle: 'Label',
    modalPromptOkButtonText: 'Ok',
    modalPromptCancelButtonText: 'Cancel'
  }

  /**
   * Creates the DigitizeButton.
   *
   * @constructs DigitizeButton
   */
  constructor(props) {

    super(props);

    if (!this.props.drawType && !this.props.editType) {
      Logger.warn('Neither "drawType" nor "editType" was provided. Digitize ' +
      'button won\'t work properly!');
    }

    this.state = {
      digitizeLayer: null,
      interactions: [],
      showLabelPrompt: false,
      textLabel: ''
    };
  }

  /**
   * `componentWillMount` method of the DigitizeButton. Just calls
   * `createDigitizeLayer` method.
   *
   * @method
   */
  componentDidMount() {
    this.createDigitizeLayer();
  }

  /**
   * Called when the digitize button is toggled. If the button state is pressed,
   * the appropriate draw, modify or select interaction will be created.
   * Otherwise, by untoggling, the same previously created interaction will be
   * removed from the map.
   *
   * @param {Boolean} pressed Whether the digitize button is pressed or not.
   *
   * @method
   */
  onToggle = pressed => {

    const {
      map,
      drawType,
      editType
    } = this.props;

    const {
      digitizeLayer,
      interactions
    } = this.state;

    this._digitizeFeatures = digitizeLayer.getSource().getFeaturesCollection();

    if (pressed) {
      if (drawType) {
        this.createDrawInteraction(pressed);
      } else if (editType) {
        this.createSelectOrModifyInteraction(pressed);
      }
    } else {
      interactions.forEach(i => map.removeInteraction(i));
      if (drawType === DigitizeButton.TEXT_DRAW_TYPE) {
        this._digitizeFeatures.un('add', this.handleTextAdding);
      } else {
        if (editType === DigitizeButton.DELETE_EDIT_TYPE) {
          this._selectInteraction.un('select', this.onFeatureRemove);
        }
        if (editType === DigitizeButton.COPY_EDIT_TYPE) {
          this._selectInteraction.un('select', this.onFeatureCopy);
        }
        map.un('pointermove', this.onPointerMove);
      }
    }
  }

  /**
   * Creates digitize vector layer and adds this to the map.
   *
   * @method
   */
  createDigitizeLayer = () => {
    const {
      digitizeLayerName,
      map
    } = this.props;

    let digitizeLayer = MapUtil.getLayerByName(map, digitizeLayerName);

    if (!digitizeLayer) {
      digitizeLayer = new OlLayerVector({
        name: digitizeLayerName,
        source: new OlSourceVector({
          features: new OlCollection(),
        }),
        style: this.getDigitizeStyleFunction
      });
      map.addLayer(digitizeLayer);
    }
    this.setState({digitizeLayer});
  }

  /**
   * The styling function for the digitize vector layer, which considers
   * different geometry types of drawn features.
   *
   * @param {OlFeature} feature The feature which is being styled.
   * @return {OlStyleStyle} The style to use.
   *
   * @method
   */
  getDigitizeStyleFunction = feature => {

    const {
      fillColor,
      selectFillColor,
      strokeColor,
      selectStrokeColor
    } = this.props;

    const {
      interactions,
    } = this.state;

    let useSelectStyle = false;
    if (interactions && interactions.length > 1 && !feature.get('isLabel')) {
      useSelectStyle = true;
    }

    switch (feature.getGeometry().getType()) {
      case DigitizeButton.POINT_DRAW_TYPE: {
        if (!feature.get('isLabel')) {
          return new OlStyleStyle({
            image: new OlStyleCircle({
              radius: 7,
              fill: new OlStyleFill({
                color: !useSelectStyle ? fillColor : selectFillColor
              }),
              stroke: new OlStyleStroke({
                color: !useSelectStyle ? strokeColor : selectStrokeColor
              })
            })
          });
        } else {
          return new OlStyleStyle({
            text: new OlStyleText({
              text: '',
              offsetX: 5,
              offsetY: 5,
              font: '12px sans-serif',
              fill: new OlStyleFill({
                color: !useSelectStyle ? fillColor : selectFillColor
              }),
              stroke: new OlStyleStroke({
                color: !useSelectStyle ? strokeColor : selectStrokeColor
              })
            })
          });
        }
      }
      case DigitizeButton.LINESTRING_DRAW_TYPE: {
        return new OlStyleStyle({
          stroke: new OlStyleStroke({
            color: !useSelectStyle ? strokeColor : selectStrokeColor,
            width: 2
          })
        });
      }
      case DigitizeButton.POLYGON_DRAW_TYPE:
      case DigitizeButton.CIRCLE_DRAW_TYPE: {
        return new OlStyleStyle({
          fill: new OlStyleFill({
            color: !useSelectStyle ? fillColor : selectFillColor
          }),
          stroke: new OlStyleStroke({
            color: !useSelectStyle ? strokeColor : selectStrokeColor,
            width: 2
          })
        });
      }
      default: {
        break;
      }
    }
  }

  /**
   * Creates a correctly configured OL draw interaction depending on given
   * drawType and adds this to the map.
   *
   * @param {Boolean} pressed Whether the digitize button is pressed or not.
   * Will be used to handle active state of the draw interaction.
   *
   * @method
   */
  createDrawInteraction = pressed => {
    const {
      drawType,
      map
    } = this.props;

    let geometryFunction;
    let type = drawType;

    if (drawType === DigitizeButton.RECTANGLE_DRAW_TYPE) {
      geometryFunction = OlInteractionDraw.createBox();
      type = DigitizeButton.CIRCLE_DRAW_TYPE;
    } else if (drawType === DigitizeButton.TEXT_DRAW_TYPE) {
      type = DigitizeButton.POINT_DRAW_TYPE;
      this._digitizeFeatures.on('add', this.handleTextAdding);
    }

    const drawInteraction = new OlInteractionDraw({
      source: this.state.digitizeLayer.getSource(),
      type: type,
      geometryFunction: geometryFunction,
      style: this.getDigitizeStyleFunction,
      freehandCondition: OlEventsCondition.never
    });

    map.addInteraction(drawInteraction);

    this.setState({
      interactions: [drawInteraction]
    }, () => {
      drawInteraction.setActive(pressed);
    });
  }

  /**
   * Creates a correctly configured OL select and/or modify and/or translate
   * interaction(s) depending on given editType and adds this/these to the map.
   *
   * @method
   */
  createSelectOrModifyInteraction = () => {
    const {
      editType,
      map
    } = this.props;

    this._selectInteraction = new OlInteractionSelect({
      condition: OlEventsCondition.singleClick,
      style: this.getDigitizeStyleFunction,
      hitTolerance: 5
    });

    if (editType === DigitizeButton.DELETE_EDIT_TYPE) {
      this._selectInteraction.on('select', this.onFeatureRemove);
    } else if (editType === DigitizeButton.COPY_EDIT_TYPE) {
      this._selectInteraction.on('select', this.onFeatureCopy);
    }

    let interactions = [this._selectInteraction];

    if (editType === DigitizeButton.EDIT_EDIT_TYPE) {
      const edit = new OlInteractionModify({
        features: this._selectInteraction.getFeatures(),
        deleteCondition: OlEventsCondition.singleClick,
        style: this.getDigitizeStyleFunction,
        pixelTolerance: 10
      });

      edit.on('modifystart', this.onModifyStart);

      const translate = new OlInteractionTranslate({
        features: this._selectInteraction.getFeatures()
      });
      interactions.push(edit, translate);
    }

    interactions.forEach(i => map.addInteraction(i));

    map.on('pointermove', this.onPointerMove);

    this.setState({interactions});
  }

  /**
   * Listener for `select` event of OL select interaction in `Delete` mode.
   * Removes selected feature from the vector source and map.
   *
   * @param {Event} evt Event containing selected feature to be removed.
   *
   * @method
   */
  onFeatureRemove = evt => {
    const feat = evt.selected[0];
    this._selectInteraction.getFeatures().remove(feat);
    this.state.digitizeLayer.getSource().removeFeature(feat);
    this.props.map.renderSync();
  }

  /**
   * Listener for `select` event of OL select interaction in `Copy` mode.
   * Creates a clone of selected feature and calls utility method to move it
   * beside the original to avoid overlapping.
   *
   * @param {Event} evt Event containing selected feature to be copied.
   *
   * @method
   */
  onFeatureCopy = evt => {
    const feat = evt.selected[0];
    const copy = feat.clone();
    const style = this.getDigitizeStyleFunction(copy);
    this._digitizeFeatures.push(copy);

    AnimateUtil.moveFeature(
      this.props.map,
      copy,
      500,
      50,
      style
    );
  }

  /**
   * Checks if a labeled feature is being modified. If yes, opens prompt to
   * input a new label.
   *
   * @param {Event} evt 'modifystart' event of OlInteractionModify.
   *
   * @method
   */
  onModifyStart = evt => {
    const feature = evt.features.getArray()[0];
    if (feature.get('isLabel')) {
      this._digitizeTextFeature = feature;
      this.setState({
        showLabelPrompt: true
      });
    }
  }

  /**
   * Changes state for showLabelPrompt to make modal for label input visible.
   *
   * @param {Event} evt Click event on adding feature to the digitize layer.
   *
   * @method
   */
  handleTextAdding = evt => {
    this.setState({
      showLabelPrompt: true
    });
    this._digitizeTextFeature = evt.element;
    this._digitizeTextFeature.set('isLabel', true);
  }

  /**
   * Callback function after `Ok` button of label input modal was clicked.
   * Turns visibility of modal off and call `setTextOnFeature` method.
   *
   * @method
   */
  onModalLabelOk = () => {
    this.setState({
      showLabelPrompt: false
    }, () => {
      this.setTextOnFeature(this._digitizeTextFeature);
    });
  }

  /**
   * Callback function after `Cancel` button of label input modal was clicked.
   * Turns visibility of modal off and removes last drawn feature from the
   * digitize layer.
   *
   * @method
   */
  onModalLabelCancel = () => {
    this.setState({
      showLabelPrompt: false,
      textLabel: ''
    }, () => {
      if (!(this.state.interactions.length > 1)) {
        this._digitizeFeatures.remove(this._digitizeTextFeature);
        this._digitizeTextFeature = null;
      }
    });
  }

  /**
   * Sets formatted label on feature.
   *
   * @param {OlFeature} feat The point feature to be styled with label.
   *
   * @method
   */
  setTextOnFeature = feat => {
    const label = StringUtil.stringDivider(this.state.textLabel, 16, '\n');
    const style = this.getDigitizeStyleFunction(feat).clone();
    style.getText().setText(label);
    feat.setStyle(style);

    this.setState({
      textLabel: ''
    });
  }

  /**
   * Called if label input field value was changed. Updates state value for
   * textLabel.
   *
   * @param {Event} evt Input event containing new text value to be set as
   * textLabel.
   *
   * @method
   */
  onLabelChange = evt => {
    this.setState({
      textLabel: evt.target.value
    });
  }

  /**
   * Sets the cursor to `pointer` if the pointer enters a non-oqaque pixel of
   * a hoverable layer.
   *
   * @param {ol.MapEvent} evt The `pointermove` event.
   *
   * @method
   */
  onPointerMove = evt => {
    if (evt.dragging) {
      return;
    }

    const { map } = this.props;
    const pixel = map.getEventPixel(evt.originalEvent);
    const hit = map.hasFeatureAtPixel(pixel);

    map.getTargetElement().style.cursor = hit ? 'pointer' : '';
  }

  /**
   * The render function.
   */
  render() {
    const {
      className,
      map,
      drawType,
      editType,
      digitizeLayerName,
      fillColor,
      strokeColor,
      selectFillColor,
      selectStrokeColor,
      modalPromptTitle,
      modalPromptOkButtonText,
      modalPromptCancelButtonText,
      ...passThroughProps
    } = this.props;


    const finalClassName = className
      ? `${className} ${this.className}`
      : this.className;

    return (
      <span className="react-geo-digitize-button-wrapper">
        <ToggleButton
          onToggle={this.onToggle}
          className={finalClassName}
          {...passThroughProps}
        />
        {
          this.state.showLabelPrompt ?
            <Modal
              title={modalPromptTitle}
              okText={modalPromptOkButtonText}
              cancelText={modalPromptCancelButtonText}
              visible={this.state.showLabelPrompt}
              closable={false}
              onOk={this.onModalLabelOk}
              onCancel={this.onModalLabelCancel}
            >
              <Input
                value={this.state.textLabel}
                onChange={this.onLabelChange}
              />
            </Modal>
            : null
        }
      </span>
    );
  }
}

export default DigitizeButton;
