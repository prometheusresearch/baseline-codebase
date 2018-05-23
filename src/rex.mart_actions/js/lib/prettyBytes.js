/**
 * @copyright 2016, Prometheus Research, LLC
 */


// Adapted from https://github.com/sindresorhus/pretty-bytes
export default function (num) {
	var exponent;
	var unit;
	var neg = num < 0;
	var units = ['B', 'KiB', 'MiB', 'GiB', 'TiB'];

	if (neg) {
		num = -num;
	}

	if (num < 1) {
		return (neg ? '-' : '') + num + ' B';
	}

	exponent = Math.min(Math.floor(Math.log(num) / Math.log(1024)), units.length - 1);
	num = Number((num / Math.pow(1024, exponent)).toFixed(2));
	unit = units[exponent];

	return (neg ? '-' : '') + num + ' ' + unit;
};

