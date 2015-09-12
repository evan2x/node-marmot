/**
 * Copyright 2015 creditease Inc. All rights reserved.
 * @description marmot init questions
 * @author evan2x(evan2zaw@gmail.com/aiweizhang@creditease.cn)
 * @date  2015/07/27
 */

/**
 * common questions
 * @public
 * @type {Array}
 */
export let common = [
    {
        name: 'engines',
        message: 'Select a template engine:',
        type: 'checkbox',
        choices: [
            'velocity',
            'freemarker'
        ],
        validate (input) {
            if( input.length > 0 ){
                this.async()(true);
            }
        }
    },
    {
        name: 'mock',
        message: 'Enter the mock data directory:',
        'default': 'mock',
        type: 'input'
    },
    {
        name: 'template',
        message: 'Enter the template directory:',
        'default': 'views',
        type: 'input'
    },
    {
        name: 'encoding',
        message: 'Select template encoding:',
        'default': 'UTF-8',
        type: 'list',
        choices: [
            'UTF-8',
            'GBK'
        ]
    },
    {
        name: 'router',
        message: 'Enter the router file(it must be .xml):',
        'default': '/router/main.xml',
        type: 'input',
        validate (input) {
            if(~input.lastIndexOf('.xml')){
                this.async()(true);
            }
        }
    }
];


/**
 * velocity questions
 * @public
 * @type {Array}
 */
export let velocity = [
    {
        name: 'vsuffix',
        message: 'Enter a velocity template file suffix:',
        'default': '.vm',
        type: 'input'
    }
];

/**
 * freemarker questions
 * @public
 * @type {Array}
 */
export let freemarker = [
    {
        name: 'fsuffix',
        message: 'Enter a freemarker template file suffix:',
        'default': '.ftl',
        type: 'input'
    },
    {
        name: 'tagSyntax',
        message: 'Select freemarker tag syntax:',
        'default': 'square_bracket',
        type: 'list',
        choices: [
            'square_bracket',
            'auto_detect'
        ]
    }
];
