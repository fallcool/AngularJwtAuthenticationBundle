(function(){

	'use strict';

	/**
	 * Controller for client route
	 */
	angular
		.module('authJwt')
		.controller('AuthCtrl', function($rootScope, $route, $scope, $routeParams, $http, $location, $modal, localStorageService, AuthenticationService) {

			$scope.connected = false;
			if(localStorageService.get('token') !== null) {
        		$http.defaults.headers.common.Authorization = 'Bearer ' + localStorageService.get('token');
                $rootScope.$broadcast('event:auth-login-complete');
                console.log($http.defaults.headers.common.Authorization);
				$scope.connected = true;
        	}
			
            $scope.$on('event:auth-loginRequired', function () {
            	if(!localStorageService.get('token')) {
            		$modal.open({
	                    templateUrl: '/bundles/pluginsangularjwt/templates/login.html',
	                    controller:  'LoginModalCtrl',
	                    backdrop:    'static'
	                });
					$scope.connected = true;
            	}
            });
			$scope.login = function() {
				$rootScope.$broadcast('event:auth-loginRequired');
			}
			$scope.logout = function() {
				AuthenticationService.logout();
				$scope.connected = false;
				$location.path('/');
				$route.reload();
			}
            
		});
})();
