'use strict';

import * as Qajax from 'qajax';
import { $, Expression, Executor, Dataset, Datum, ChainExpression } from 'plywood';
import { DataSource } from '../../models/index';

function getSplitsDescription(ex: Expression): string {
  var splits: string[] = [];
  ex.forEach((ex) => {
    if (ex instanceof ChainExpression) {
      ex.actions.forEach((action) => {
        if (action.action === 'split') splits.push(action.expression.toString());
      });
    }
  });
  return splits.join(';');
}

export function queryUrlExecutorFactory(name: string, url: string): Executor {
  return (ex: Expression) => {
    return Qajax({
      method: "POST",
      url: url + '?by=' + getSplitsDescription(ex),
      data: {
        dataset: name,
        expression: ex.toJS()
      }
    })
      .then(Qajax.filterSuccess)
      .then(Qajax.toJSON)
      .then(
        (dataJS) => {
          return Dataset.fromJS(dataJS);
        },
        (xhr: XMLHttpRequest): Dataset => {
          throw new Error(JSON.parse(xhr.responseText).message);
        }
      );
  };
}

export function loadDataSource(unloadedDataSource: DataSource): Q.Promise<DataSource> {
  if (unloadedDataSource.metadataLoaded) return Q(unloadedDataSource);

  return Qajax({
    method: "GET",
    url: this.source
  })
    .then(Qajax.filterSuccess)
    .then(Qajax.toJSON)
    .then(
      (dataJS) => {
        dataJS.forEach((d: Datum) => {
          d['time'] = new Date(d['time']);
        });
        return unloadedDataSource.loadDataArray(dataJS);
      },
      (xhr: XMLHttpRequest): DataSource => {
        throw new Error(JSON.parse(xhr.responseText).message);
      }
    );
}