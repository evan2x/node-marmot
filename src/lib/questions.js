
/**
* common questions
* @public
* @type {Array}
*/
export let common = [
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
export let velocity = [
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
  },
  {
    name: 'macro',
    message(answers) {
      return `File paths of velocity global macro(must be '${answers.vextension}' file with comma-separated):`;
    },
    type: 'input',
    validate(value, answers) {
      if (value.trim() !== '' && !value.endsWith(answers.vextension)) {
        return `You need to provide one or more file paths with ${answers.vextension} extension`;
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
