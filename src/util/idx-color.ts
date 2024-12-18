/*
 * Copyright 2023 Google Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

const COLORS: Record<string, Record<string,string>> = {
  'gray': {
    '50': '#f4f7fd',
    '100': '#d9dfe7',
    '200': '#bfc7d2',
    '300': '#a4afbd',
    '400': '#8b98a9',
    '500': '#738295',
    '600': '#5d6a7d',
    '700': '#475365',
    '800': '#333e4f',
    '900': '#1f2939',
    '925': '#171F2B',
    '950': '#10151D',
    '975': '#080A0E',
  },
  'blue': {
    '50': '#f1f3fe',
    '100': '#e5eaff',
    '200': '#c7d3ff',
    '300': '#a2b6ff',
    '400': '#708fff',
    '500': '#5173f1',
    '600': '#3c60dd',
    '700': '#264dcb',
    '800': '#0038b8',
    '900': '#002487',
  },
  'green': {
    '50': '#e8fbec',
    '100': '#ccf5db',
    '200': '#98e4b9',
    '300': '#66ce98',
    '400': '#17b877',
    '500': '#17975f',
    '600': '#007b49',
    '700': '#00673c',
    '800': '#00522f',
    '900': '#00391f',
  },
  'yellow': {
    '50': '#fffce7',
    '100': '#fff0ca',
    '200': '#ffdca8',
    '300': '#ffc26e',
    '400': '#ffa23e',
    '500': '#df8128',
    '600': '#c16f23',
    '700': '#9d5220',
    '800': '#834314',
    '900': '#6b3311',
  },
  'orange': {
    '50': '#fff4ee',
    '100': '#ffe6d8',
    '200': '#ffc9aa',
    '300': '#ffa268',
    '400': '#ff7d1d',
    '500': '#e45d0c',
    '600': '#cb470d',
    '700': '#a93807',
    '800': '#882d00',
    '900': '#6c2400',
  },
  'red': {
    '50': '#ffeeed',
    '100': '#ffdbda',
    '200': '#ffb5b4',
    '300': '#fc8f8e',
    '400': '#f76769',
    '500': '#df4047',
    '600': '#c1313b',
    '700': '#a52430',
    '800': '#891524',
    '900': '#680b10',
  },
  'purple': {
    '50': '#fcf3ff',
    '100': '#f2e6ff',
    '200': '#e0ccff',
    '300': '#c8aaff',
    '400': '#a87ffb',
    '500': '#8964e8',
    '600': '#6f4cde',
    '700': '#603bce',
    '800': '#4d21bb',
    '900': '#340099',
  },
  'pink': {
    '50': '#fff4f5',
    '100': '#ffe5e9',
    '200': '#ffc6d0',
    '300': '#ff9cae',
    '400': '#f96e8c',
    '500': '#df456b',
    '600': '#c43058',
    '700': '#ad1c48',
    '800': '#910036',
    '900': '#670023',
  },
  'cyan': {
    '50': '#eafafe',
    '100': '#d6effa',
    '200': '#abe1f8',
    '300': '#71c2ee',
    '400': '#25a6e9',
    '500': '#008ac9',
    '600': '#0075a2',
    '700': '#00607e',
    '800': '#004b5e',
    '900': '#003544',
  },
};

export default function (hue: string, value: string) {
  hue = (hue || '').toString().toLowerCase();
  value = (value || '').toString().toLowerCase();

  if (!(hue in COLORS)) {
    return '';
  }

  let h = COLORS[hue];
  if (!(value in h)) {
    return '';
  }

  return h[value];
};