/**
* common questions
* @public
* @type {Array}
*/
exports.common = [
  {
    name: 'engines',
    message: 'Template engine:',
    type: 'checkbox',
    choices: [
      'velocity',
      'freemarker'
    ]
  },
  {
    name: 'mock',
    message: 'Mock data directory:',
    'default': 'mock',
    type: 'input'
  },
  {
    name: 'template',
    message: 'Template directory:',
    'default': 'views',
    type: 'input'
  },
  {
    name: 'router',
    message: 'Router file path(it must be a .xml file):',
    'default': '/router/main.xml',
    type: 'input',
    validate(value) {
      if (!value.endsWith('.xml')) {
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
exports.velocity = [
  {
    name: 'vextension',
    message: 'Velocity template file extension:',
    'default': '.vm',
    type: 'input',
    validate(value) {
      if (!value.startsWith('.')) {
        return 'You need to provide a correct extension';
      }

      return true;
    }
  },
  {
    name: 'tools',
    message: 'File paths of velocity tools.xml(must be a \'.xml\' file):',
    type: 'input',
    validate(value) {
      if (value.trim() !== '' && value.endsWith('.xml')) {
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
exports.freemarker = [
  {
    name: 'fextension',
    message: 'Freemarker template file extension:',
    'default': '.ftl',
    type: 'input',
    validate(value) {
      if (!value.startsWith('.')) {
        return 'You need to provide a correct extension';
      }

      return true;
    }
  },
  {
    name: 'tagSyntax',
    message: 'Freemarker tag syntax:',
    'default': 'square_bracket',
    type: 'list',
    choices: [
      'square_bracket',
      'auto_detect'
    ]
  }
];
