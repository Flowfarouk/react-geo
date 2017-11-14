/*eslint-env jest*/


import TestUtil from '../Util/TestUtil';
import { LayerTransparencySlider } from '../index';

describe('<LayerTransparencySlider />', () => {
  let layer;

  beforeEach(() => {
    layer = TestUtil.createVectorLayer();
  });

  it('is defined', () => {
    expect(LayerTransparencySlider).not.toBeUndefined();
  });

  it('can be rendered', () => {
    const props = {
      layer: layer
    };
    const wrapper = TestUtil.mountComponent(LayerTransparencySlider, props);
    expect(wrapper).not.toBeUndefined();
  });

  it('returns the the transparency of the layer', () => {
    layer.setOpacity(0.09);
    const props = {
      layer: layer
    };

    const wrapper = TestUtil.mountComponent(LayerTransparencySlider, props);
    let transparency = wrapper.instance().getLayerTransparency();
    expect(transparency).toBe(91);
  });

  it('updates the opacity of the layer by providing a transparency value', () => {
    const props = {
      layer: layer
    };
    const wrapper = TestUtil.mountComponent(LayerTransparencySlider, props);

    wrapper.instance().setLayerTransparency(91);
    expect(layer.getOpacity()).toBe(0.09);
  });

});
