import readline from 'readline';
import Promise, { promisify } from 'bluebird';
import {
    T as True,
    concat,
    cond,
    curry,
    keys,
    mergeAll
} from 'ramda';
import 'colors';
import { getTypeName, cast } from './types';

/**
 * Returns an IO object that promisifies everything that is necessary and exposes
 * a clear API
 *
 * @author Marcelo Haskell Camargo
 * @return {Object}
 */
function IO() {
    const io = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    return {
        read: promisify((text, callback) => {
            io.question(`${text}: `, callback.bind(null, null));
        }),
        print: promisify((text, callback) => {
            io.write(`${text}\n`);
            callback();
        }),
        close: io.close.bind(io)
    };
}

/**
 * Returns the pure JS values from received questions that will be answered
 * @param {Object} questions
 * @return {Object} answers for the questions by key
 */
export function ask(questions) {
    const io = IO();
    const recur = curry((remaining, answered, callback) => {
        if (remaining.length) {
            const [head, ...tail] = remaining;
            const { description, type, default: def } = questions[head];

            io.read(`(${getTypeName(type).red}) ${description.blue}`).done(answer => {
                const value = cast(answer, type, def);

                const args = value === null
                    ? [remaining, answered, callback]
                    : [tail, concat(answered, [{ [head]: value }]), callback];

                return recur(...args);
            })
        } else {
            io.close();
            callback(answered);
        }
    });

    return new Promise(recur(keys(questions), []));
}
