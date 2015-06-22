'use strict'

import angular from 'angular'

angular.module('sample', [])
.run(() => console.log(`Application ready, angular version ${angular.version.full}`))
