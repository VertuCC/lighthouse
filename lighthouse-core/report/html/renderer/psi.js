/**
 * @license
 * Copyright 2018 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS-IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
'use strict';

/* globals self DOM PerformanceCategoryRenderer Util DetailsRenderer */


/**
 * Returns all the elements that PSI needs to render the report
 * We expose this helper method to minimize the 'public' API surface of the renderer
 * and allow us to refactor without two-sided patches.
 *
 *   const {scoreGaugeEl, perfCategoryEl, finalScreenshotDataUri} = prepareLabData(
 *      LHResultJsonString,
 *      document
 *   );
 *
 * @param {string} LHResultJsonString The stringified version of {LH.Result}
 * @param {Document} document The host page's window.document
 * @return {{scoreGaugeEl: Element, perfCategoryEl: Element, finalScreenshotDataUri: string|null}}
 */
function prepareLabData(LHResultJsonString, document) {
  const lhResult = /** @type {LH.Result} */ JSON.parse(LHResultJsonString);
  const dom = new DOM(document);

  const reportLHR = Util.prepareReportResult(lhResult);
  const perfCategory = reportLHR.reportCategories.find(cat => cat.id === 'performance');
  if (!perfCategory) throw new Error(`No performance category. Can't make lab data section`);
  if (!reportLHR.categoryGroups) throw new Error(`No category groups found.`);

  const perfRenderer = new PerformanceCategoryRenderer(dom, new DetailsRenderer(dom));
  // PSI environment string will ensure the categoryHeader and permalink elements are excluded
  const perfCategoryEl = perfRenderer.render(perfCategory, reportLHR.categoryGroups, 'PSI');

  const scoreGaugeEl = dom.find('.lh-score__gauge', perfCategoryEl);
  scoreGaugeEl.remove();
  const scoreGaugeWrapperEl = dom.find('.lh-gauge__wrapper', scoreGaugeEl);
  scoreGaugeWrapperEl.classList.add('lh-gauge__wrapper--huge');
  // Remove navigation link on gauge
  scoreGaugeWrapperEl.removeAttribute('href');

  const finalScreenshotDataUri = _getFinalScreenshot(perfCategory);
  return {scoreGaugeEl, perfCategoryEl, finalScreenshotDataUri};
}

/**
 * @param {LH.ReportResult.Category} perfCategory
 * @return {null|string}
 */
function _getFinalScreenshot(perfCategory) {
  const auditRef = perfCategory.auditRefs.find(audit => audit.id === 'final-screenshot');
  if (!auditRef || !auditRef.result || auditRef.result.scoreDisplayMode === 'error') return null;
  return auditRef.result.details.data;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = prepareLabData;
  module.exports._getFinalScreenshot = _getFinalScreenshot;
} else {
  // @ts-ignore we avoid exposing _getFinalScreenshot to the browser
  self.prepareLabData = prepareLabData;
}