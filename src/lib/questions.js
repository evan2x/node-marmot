
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
    ]
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
    name: 'router',
    message: 'Enter the router file(it must be a .xml file):',
    'default': '/router/main.xml',
    type: 'input',
    validate(input) {
      if (!input.endsWith('.xml')) {
        return 'You need to provide a XML format file';
      }

      return true;
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
    type: 'input',
    validate(input) {
      if (!input.startsWith('.')) {
        return 'You need to provide a correct suffix';
      }

      return true;
    }
  },
  {
    name: 'tools',
    message: 'Enter a velocity tools.xml file(it must be a .xml file)',
    type: 'input',
    validate(input) {
      if (input.trim() !== '' && input.endsWith('.xml')) {
        return 'You need to provide a XML format file';
      }

      return true;
    }
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
    type: 'input',
    validate(input) {
      if (!input.startsWith('.')) {
        return 'You need to provide a correct suffix';
      }

      return true;
    }
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
