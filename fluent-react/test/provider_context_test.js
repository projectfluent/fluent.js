import React, {Component} from 'react';
import PropTypes from "prop-types";
import assert from 'assert';
import { render } from 'enzyme';
import { FluentBundle, FluentResource } from '../../fluent-bundle/src';
import { LocalizationProvider, isReactLocalization } from '../src/index';


suite('LocalizationProvider - context', function() {
  test('exposes localization', function() {
    const bundle = new FluentBundle();
    bundle.addResource(new FluentResource("foo = Foo"));

    class Testing extends Component {
      render() {
        return <p>{this.context.l10n.getString("foo")}</p>;
      }
    }

    Testing.contextTypes = {
      l10n: isReactLocalization
    };

    const wrapper = render(
      <LocalizationProvider bundles={[bundle]}>
        <Testing />
      </LocalizationProvider>
    );

    assert.ok(wrapper.is("p"));
    assert.ok(wrapper.text() === "Foo");
  });

  test('exposes custom parseMarkup', function() {
    class Testing extends Component {
      render() {
        return <p>{this.context.parseMarkup()}</p>;
      }
    }

    Testing.contextTypes = {
      parseMarkup: PropTypes.func
    };

    const wrapper = render(
      <LocalizationProvider bundles={[]} parseMarkup={() => "Test"}>
        <Testing />
      </LocalizationProvider>
    );

    assert.ok(wrapper.is("p"));
    assert.ok(wrapper.text() === "Test");
  });
});
