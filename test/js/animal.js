/**
 *
 * @copyright   Copyright (C) 2005 - 2023 Thierry Bela.
 *
 * dual licensed
 *
 * @license     LGPL v3
 * @license     MIT License
 */

class Animal {

    type;
    name;
    age;

    constructor(type, age, name = '') {

        this.type = type;
        this.age = age;
        this.name = name;

        if (name === '') {

            let number = Math.floor(3 + 3 * Math.random());

            while (number--) {

                this.name += String.fromCharCode([65, 97][Math.floor(2 * Math.random())] + Math.floor(26 * Math.random()))
            }
        }
    }

    say() {

        return `${this.name} says: I am a ${this.age} year(s) old ${this.type}`;
    }
}