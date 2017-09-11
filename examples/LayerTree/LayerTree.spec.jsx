/*eslint-env mocha*/
import expect from 'expect.js';
import sinon from 'sinon';

import OlGroupLayer from 'ol/layer/group';
import OlTileLayer from 'ol/layer/tile';
import OlTileWMS from 'ol/source/tilewms';

import LayerTree from './LayerTree.jsx';
import TestUtils from '../Util/TestUtils';

describe('<LayerTree />', () => {
  let layerGroup;
  let map;

  beforeEach(() => {
    const layerSource1 = new OlTileWMS();
    const layer1 = new OlTileLayer({
      name: 'layer1',
      source: layerSource1
    });
    const layerSource2 = new OlTileWMS();
    const layer2 = new OlTileLayer({
      name: 'layer2',
      visible: false,
      source: layerSource2
    });
    layerGroup = new OlGroupLayer({
      layers: [layer1, layer2]
    });

    map = TestUtils.createMap();
    map.setLayerGroup(layerGroup);
  });

  it('is defined', () => {
    expect(LayerTree).not.to.be(undefined);
  });

  it('can be rendered', () => {
    const wrapper = TestUtils.mountComponent(LayerTree);
    expect(wrapper).not.to.be(undefined);
  });

  describe('new layerGroup as prop', () => {

    it('calls treeNodesFromLayerGroup and checkedKeysFromLayerGroup', () => {
      const wrapper = TestUtils.mountComponent(LayerTree);
      const spy1 = sinon.spy(wrapper.instance(), 'treeNodesFromLayerGroup');
      const spy2 = sinon.spy(wrapper.instance(), 'checkedKeysFromLayerGroup');

      wrapper.setProps({
        layerGroup: new OlGroupLayer({})
      });

      expect(spy1).to.have.property('callCount', 1);
      expect(spy2).to.have.property('callCount', 1);

    });
  });

  describe('<TreeNode> creation', () => {

    it('adds a <TreeNode> for every child', () => {
      const props = {
        layerGroup,
        map
      };
      const wrapper = TestUtils.mountComponent(LayerTree, props);
      const treeNodes = wrapper.children('TreeNode');

      expect(treeNodes).to.have.length(layerGroup.getLayers().getLength());
    });

    // TODO This test could be better if the TreeNodes where iterable, but they
    // are not. See comment below.
    it('can handle nested `ol.layer.group`s', () => {
      const props = {
        layerGroup,
        map
      };

      const subLayer = new OlTileLayer({
        name: 'subLayer',
        source: new OlTileWMS()
      });
      const nestedLayerGroup = new OlGroupLayer({
        name: 'nestedLayerGroup',
        layers: [subLayer]
      });
      layerGroup.getLayers().push(nestedLayerGroup);

      const wrapper = TestUtils.mountComponent(LayerTree, props);
      const treeNodes = wrapper.children('TreeNode');

      // It is not an instanceof TreeNode see: https://github.com/ant-design/ant-design/issues/4688
      const subNode = treeNodes.nodes[2].props.children[0];
      expect(subNode.props.title).to.eql(subLayer.get('name'));
    });

    it('sets the right titles for the layers', () => {
      const props = {
        layerGroup,
        map
      };
      const wrapper = TestUtils.mountComponent(LayerTree, props);
      const treeNodes = wrapper.children('TreeNode');
      treeNodes.forEach((node, index) => {
        const layer = layerGroup.getLayers().item(index);
        expect(node.props().title).to.eql(layer.get('name'));
      });
    });

    it('sets the right keys for the layers', () => {
      const props = {
        layerGroup,
        map
      };
      const wrapper = TestUtils.mountComponent(LayerTree, props);
      const treeNodes = wrapper.children('TreeNode');

      treeNodes.forEach((node, index) => {
        const layer = layerGroup.getLayers().item(index);
        expect(node.props().eventKey).to.have.eql(layer.ol_uid);
      });
    });

    it('sets visible layers as checked', () => {
      const props = {
        layerGroup,
        map
      };
      const wrapper = TestUtils.mountComponent(LayerTree, props);
      const treeNodes = wrapper.children('TreeNode');

      treeNodes.forEach((node, index) => {
        const layer = layerGroup.getLayers().item(index);
        expect(layer.getVisible()).to.eql(node.props().checked);
      });
    });
  });

  describe('onCheck', () => {

    it('sets the correct visibility to the layer from the checked state', () => {
      const props = {
        layerGroup,
        map
      };
      const wrapper = TestUtils.mountComponent(LayerTree, props);
      const treeNodes = wrapper.children('TreeNode');

      treeNodes.forEach((node, index) => {
        const layer = layerGroup.getLayers().item(index);
        const checkBox = node.find('.ant-tree-checkbox');
        const wasChecked = node.props().checked;
        const wasVisible = layer.getVisible();
        checkBox.simulate('click');
        expect(wasVisible).to.eql(!layer.getVisible());
        expect(wasChecked).to.eql(!node.props().checked);
      });
    });
  });

  describe('onDrop', () => {

    describe('getLayerPositionInfo', () => {
      let props;
      let subLayer;
      let nestedLayerGroup;

      beforeEach(() => {
        props = {
          layerGroup,
          map
        };
        subLayer = new OlTileLayer({
          name: 'subLayer',
          source: new OlTileWMS()
        });
        nestedLayerGroup = new OlGroupLayer({
          name: 'nestedLayerGroup',
          layers: [subLayer]
        });
        layerGroup.getLayers().push(nestedLayerGroup);
      });

      it('uses the map if second argument is empty', () => {
        const wrapper = TestUtils.mountComponent(LayerTree, props);
        const layer = layerGroup.getLayers().item(0);
        const layerPositionInfo = wrapper.instance().getLayerPositionInfo(layer);

        expect(layerPositionInfo).to.be.eql({
          position: 0,
          collection: layerGroup.getLayers()
        });
      });

      it('uses the layerGroup if given as second argument', () => {
        const wrapper = TestUtils.mountComponent(LayerTree, props);
        const layerPositionInfo = wrapper.instance().getLayerPositionInfo(subLayer, nestedLayerGroup);

        expect(layerPositionInfo).to.be.eql({
          position: 0,
          collection: nestedLayerGroup.getLayers()
        });
      });

      it('works iterative', () => {
        const wrapper = TestUtils.mountComponent(LayerTree, props);
        const layerPositionInfo = wrapper.instance().getLayerPositionInfo(subLayer, map);

        expect(layerPositionInfo).to.be.eql({
          position: 0,
          collection: nestedLayerGroup.getLayers()
        });
      });

    });

    // TODO add test when bug in react-component/tree is fixed
    // let props = {};
    //
    // beforeEach(() => {
    //   props = {
    //     layerGroup,
    //     map
    //   };
    //   const layer3 = new OlTileLayer({
    //     name: 'layer3',
    //     source: new OlTileWMS()
    //   });
    //   const subLayer = new OlTileLayer({
    //     name: 'subLayer',
    //     source: new OlTileWMS()
    //   });
    //   const nestedLayerGroup = new OlGroupLayer({
    //     name: 'nestedLayerGroup',
    //     layers: [subLayer]
    //   });
    //   props.layerGroup.getLayers().push(layer3);
    //   props.layerGroup.getLayers().push(nestedLayerGroup);
    // });
    //
    // it('can handle drop on leaf', () => {
    //   const wrapper = TestUtils.mountComponent(LayerTree, props);
    //   const firstNode = wrapper.childAt(0);
    //   const firstLayer = layerGroup.getLayers().item(0);
    //   const thirdNode = wrapper.childAt(2);
    //   const thirdLayer = layerGroup.getLayers().item(2);
    //   const dragTarget = firstNode.find('.ant-tree-node-content-wrapper');
    //   const dropTarget = thirdNode.find('.ant-tree-node-content-wrapper');
    //
    //   dragTarget.simulate('dragStart');
    //   thirdNode.simulate('drop');
    // });

    // it('can handle drop before leaf', () => {
    //   const wrapper = TestUtils.mountComponent(LayerTree, props);
    //   const treeNodes = wrapper.children('TreeNode');
    //   const firstNode = treeNodes.get(0);
    //   const thirdNode = treeNodes.get(2);
    // });

    // it('can handle drop after leaf', () => {
    //   const wrapper = TestUtils.mountComponent(LayerTree, props);
    //   const treeNodes = wrapper.children('TreeNode');
    //   const firstNode = treeNodes.get(0);
    //   const thirdNode = treeNodes.get(2);
    // });

    // it('can handle drop on folder', () => {
    //   const wrapper = TestUtils.mountComponent(LayerTree, props);
    //   const treeNodes = wrapper.children('TreeNode');
    //   const firstNode = treeNodes.get(0);
    //   const folderNode = treeNodes.get(3);
    // });
  });

});
