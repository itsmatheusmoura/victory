/*eslint no-magic-numbers: ["error", { "ignore": [-1, 0, 1, 2] }]*/
import { defaults } from "lodash";
import { Helpers, Data, Domain, Scale } from "victory-core";

export default {
  getBaseProps(props, fallbackProps) {
    props = Helpers.modifyProps(props, fallbackProps, "line");
    const calculatedValues = this.getCalculatedValues(props);
    const { scale, data, domain, style, origin } = calculatedValues;
    const {
      interpolation, width, height, events, sharedEvents, standalone, groupComponent, theme,
      polar, padding
    } = props;
    const initialChildProps = {
      parent: {
        style: style.parent, scale, data, height, width, domain, standalone, polar, origin, padding
      },
      all: { data:
        { polar, origin, scale, data, interpolation, groupComponent, theme, style: style.data }
      }
    };
    return data.reduce((childProps, datum, index) => {
      const text = this.getLabelText(props, datum, index);
      if (text !== undefined && text !== null || events || sharedEvents) {
        const eventKey = datum.eventKey || index;
        childProps[eventKey] = { labels: this.getLabelProps(text, index, props, calculatedValues) };
      }
      return childProps;
    }, initialChildProps);
  },

  getCalculatedValues(props) {
    let data = Data.getData(props);

    if (data.length < 2) {
      data = [];
    }

    const range = {
      x: Helpers.getRange(props, "x"),
      y: Helpers.getRange(props, "y")
    };
    const domain = {
      x: Domain.getDomain(props, "x"),
      y: Domain.getDomain(props, "y")
    };
    const scale = {
      x: Scale.getBaseScale(props, "x").domain(domain.x).range(range.x),
      y: Scale.getBaseScale(props, "y").domain(domain.y).range(range.y)
    };
    const origin = props.polar ? props.origin || Helpers.getPolarOrigin(props) : undefined;
    const defaultStyles = props.theme && props.theme.line && props.theme.line.style ?
      props.theme.line.style : {};
    const style = Helpers.getStyles(props.style, defaultStyles);

    return { domain, data, scale, style, origin };
  },

  getLabelText(props, datum, index) {
    if (datum.label !== undefined) {
      return datum.label;
    }
    return Array.isArray(props.labels) ? props.labels[index] : props.labels;
  },

  getLabelProps(text, index, props, calculatedProps) { // eslint-disable-line max-params
    const { scale, data, style } = calculatedProps;
    const datum = data[index];
    const { x, y } = Helpers.scalePoint(Helpers.getPoint(datum), scale, props.polar);
    const labelStyle = this.getLabelStyle(style) || {};
    const sign = (datum._y1 || datum._y) < 0 ? -1 : 1;
    return {
      style: labelStyle,
      x,
      y: y - sign * (labelStyle.padding || 0),
      text,
      index,
      scale,
      datum,
      data,
      textAnchor: labelStyle.textAnchor,
      verticalAnchor: labelStyle.verticalAnchor || "end",
      angle: labelStyle.angle
    };
  },

  getLabelPosition(datum, scale) {
    return {
      x: scale.x(datum._x1 !== undefined ? datum._x1 : datum._x),
      y: scale.y(datum._y1 !== undefined ? datum._y1 : datum._y)
    };
  },

  getLabelStyle(style) {
    const dataStyle = style.data || {};
    const labelStyle = style.labels || {};
    // match labels styles to data style by default (fill, opacity, others?)
    const opacity = dataStyle.opacity;
    // match label color to data color if it is not given.
    // use fill instead of stroke for text
    const fill = dataStyle.stroke;
    const padding = labelStyle.padding || 0;
    return defaults({}, labelStyle, { opacity, fill, padding });
  }
};
