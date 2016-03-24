"use strict";

System.register(["lodash"], function (_export, _context) {
  var _, _createClass, EndpointConfigCtrl;

  function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }

  return {
    setters: [function (_lodash) {
      _ = _lodash.default;
    }],
    execute: function () {
      _createClass = function () {
        function defineProperties(target, props) {
          for (var i = 0; i < props.length; i++) {
            var descriptor = props[i];
            descriptor.enumerable = descriptor.enumerable || false;
            descriptor.configurable = true;
            if ("value" in descriptor) descriptor.writable = true;
            Object.defineProperty(target, descriptor.key, descriptor);
          }
        }

        return function (Constructor, protoProps, staticProps) {
          if (protoProps) defineProperties(Constructor.prototype, protoProps);
          if (staticProps) defineProperties(Constructor, staticProps);
          return Constructor;
        };
      }();

      _export("EndpointConfigCtrl", EndpointConfigCtrl = function () {
        /** @ngInject */

        function EndpointConfigCtrl($scope, $injector, $location, $modal, $anchorScroll, $timeout, $window, backendSrv, alertSrv) {
          _classCallCheck(this, EndpointConfigCtrl);

          var self = this;
          this.backendSrv = backendSrv;
          this.$location = $location;
          this.alertSrv = alertSrv;
          this.pageReady = false;
          this.monitorLastState = {};

          this.frequencyOpts = [];
          var freqOpt = [10, 30, 60, 120];
          _.forEach(freqOpt, function (f) {
            self.frequencyOpts.push({ value: f, label: "Every " + f + "s" });
          });

          this.timeoutRegex = /^([1-9](\.\d)?|10)$/;
          this.editor = { index: 0 };
          this.newEndpointName = "";
          this.endpoint = {};
          this.allCollectors = [];
          this.collectorsOption = { selection: "all" };
          this.collectorsByTag = {};
          this.global_collectors = { collector_ids: [], collector_tags: [] };
          this.ignoreChanges = false;
          this.originalState = {};
          this.defaultChecks = [{
            _configured: false,
            type: "http",
            settings: {
              "host": "",
              "port": 80,
              "path": "/"
            },
            enabled: false,
            frequency: 60,
            health_settings: {
              steps: 3,
              num_collectors: 1,
              notifications: {
                enabled: false,
                addresses: ""
              }
            }
          }, {
            _configured: false,
            type: "http",
            settings: {
              "host": "",
              "port": 443,
              "path": "/"
            },
            enabled: false,
            frequency: 60,
            health_settings: {
              steps: 3,
              num_collectors: 1,
              notifications: {
                enabled: false,
                addresses: ""
              }
            }
          }, {
            _configured: false,
            type: "http",
            settings: {
              "record": "",
              "recordType": "A",
              "servers": "8.8.8.8"
            },
            enabled: false,
            frequency: 60,
            health_settings: {
              steps: 3,
              num_collectors: 1,
              notifications: {
                enabled: false,
                addresses: ""
              }
            }
          }, {
            _configured: false,
            type: "http",
            settings: {
              "host": ""
            },
            enabled: false,
            frequency: 10,
            health_settings: {
              steps: 3,
              num_collectors: 1,
              notifications: {
                enabled: false,
                addresses: ""
              }
            }
          }];

          var promises = [];
          if ("endpoint" in $location.search()) {
            promises.push(this.getEndpoint($location.search().endpoint));
          } else {
            this.endpoint = { name: "", checks: this.defaultChecks };
            this.pageReady = true;
          }

          promises.push(this.getCollectors());
          Promise.all(promises).then(function () {
            self.pageReady = true;
            self.reset();
            $timeout(function () {
              $anchorScroll();
            }, 0, false);
          });

          if ($location.search().check) {
            switch ($location.search().check) {
              case "ping":
                self.showPing = true;
                break;
              case "dns":
                self.showDNS = true;
                break;
              case "http":
                self.showHTTP = true;
                break;
              case "https":
                self.showHTTPS = true;
                break;
            }
          }
        }

        _createClass(EndpointConfigCtrl, [{
          key: "getCollectors",
          value: function getCollectors() {
            var self = this;
            return this.backendSrv.get('api/plugin-proxy/worldping-app/api/probes').then(function (collectors) {
              self.collectors = collectors;
              _.forEach(collectors, function (c) {
                self.allCollectors.push(c.id);
                _.forEach(c.tags, function (t) {
                  if (!(t in self.collectorsByTag)) {
                    self.collectorsByTag[t] = [];
                  }
                  self.collectorsByTag[t].push(c);
                });
              });
              self.global_collectors = { collector_ids: self.allCollectors, collector_tags: [] };
            });
          }
        }, {
          key: "collectorCount",
          value: function collectorCount(monitor) {
            var self = this;
            if (!monitor) {
              return 0;
            }
            var ids = {};
            _.forEach(monitor.collector_ids, function (id) {
              ids[id] = true;
            });
            _.forEach(monitor.collector_tags, function (t) {
              _.forEach(self.collectorsByTag[t], function (c) {
                ids[c.id] = true;
              });
            });
            return Object.keys(ids).length;
          }
        }, {
          key: "reset",
          value: function reset() {
            var self = this;
            this.discovered = false;
            this.discoveryInProgress = false;
            this.discoveryError = false;
            this.showConfig = false;
            this.endpoint = { "name": "", checks: this.defaultChecks };
          }
        }, {
          key: "cancel",
          value: function cancel() {
            this.reset();
            this.ignoreChanges = true;
            window.history.back();
          }
        }, {
          key: "getEndpoint",
          value: function getEndpoint(id) {
            var self = this;
            return this.backendSrv.get('api/plugin-proxy/worldping-app/api/endpoint/' + id).then(function (endpoint) {
              self.endpoint = endpoint;
              self.pageReady = true;
            });
          }
        }, {
          key: "remove",
          value: function remove(endpoint) {
            var self = this;
            this.backendSrv.delete('api/plugin-proxy/worldping-app/api/endpoints/' + endpoint.id).then(function () {
              self.$location.path('plugins/worldping-app/page/endpoints');
            });
          }
        }, {
          key: "updateEndpoint",
          value: function updateEndpoint() {
            this.endpoint.name = this.newEndpointName;
            this.backendSrv.post('api/plugin-proxy/worldping-app/api/endpoints', this.endpoint);
          }
        }, {
          key: "save",
          value: function save(location) {
            var self = this;
            var promises = [];

            self.backendSrv.post('api/plugin-proxy/worldping-app/api/endpoints', self.endpoint).then(function () {
              if (location) {
                self.$location.path(location);
              } else {
                self.$location.path("plugins/worldping-app/page/endpoints");
              }
            });
          }
        }, {
          key: "parseSuggestions",
          value: function parseSuggestions(payload) {
            _.defaults(suggestion, defaults);
            this.endpoint.checks = suggestions;
          }
        }, {
          key: "skipDiscovery",
          value: function skipDiscovery() {
            this.discoveryInProgress = false;
            this.showConfig = true;
            this.discoveryError = false;
          }
        }, {
          key: "monitors",
          value: function monitors(type) {
            var check;
            _.forEach(this.endpoint.checks, function (c) {
              if (c.type === type) {
                check = c;
              }
            });
            return check;
          }
        }, {
          key: "discover",
          value: function discover(endpoint) {
            var self = this;
            this.discoveryInProgress = true;
            this.discoveryError = false;
            this.backendSrv.get('api/plugin-proxy/worldping-app/api/endpoints/discover', endpoint).then(function (resp) {
              if (!self.showConfig) {
                if (endpoint.name.indexOf("://") > -1) {
                  //endpoint name is in the form scheme://domain
                  var parser = document.createElement('a');
                  parser.href = endpoint.name;
                  endpoint.name = parser.hostname;
                }
                self.showConfig = true;
                self.discovered = true;
                self.parseSuggestions(resp);
              }
            }, function () {
              self.discoveryError = "Failed to discover endpoint.";
            }).finally(function () {
              self.discoveryInProgress = false;
            });
          }
        }, {
          key: "addEndpoint",
          value: function addEndpoint() {
            var self = this;
            if (this.endpoint.id) {
              return this.updateEndpoint();
            }

            this.backendSrv.put('api/plugin-proxy/worldping-app/api/endpoints', this.endpoint).then(function (resp) {
              self.endpoint = resp;
              self.ignoreChanges = true;
              self.alertSrv.set("endpoint added", '', 'success', 3000);
              self.$location.path("worldping/endpoints/summary/" + resp.id);
            });
          }
        }, {
          key: "changesPending",
          value: function changesPending() {
            var self = this;
            var changes = false;
            _.forEach(this.endpoint.checks, function (check) {
              if (check._configured === false) {
                return;
              }
              if (!angular.equals(check, self.lastCheckState[check.type])) {
                changes = true;
              }
            });
            return changes;
          }
        }, {
          key: "gotoDashboard",
          value: function gotoDashboard(endpoint, type) {
            var self = this;
            if (!type) {
              type = 'summary';
            }
            var search = {
              "var-collector": "All",
              "var-endpoint": this.endpoint.slug
            };
            switch (type) {
              case "summary":
                self.$location.path("/dashboard/db/worldping-endpoint-summary").search(search);
                break;
              case "ping":
                self.$location.path("/dashboard/db/worldping-endpoint-ping").search(search);
                break;
              case "dns":
                self.$location.path("/dashboard/db/worldping-endpoint-dns").search(search);
                break;
              case "http":
                search['var-protocol'] = "http";
                self.$location.path("/dashboard/db/worldping-endpoint-web").search(search);
                break;
              case "https":
                search['var-protocol'] = "https";
                self.$location.path("/dashboard/db/worldping-endpoint-web").search(search);
                break;
              default:
                self.$location.path("/dashboard/db/worldping-endpoint-summary").search(search);
                break;
            }
          }
        }]);

        return EndpointConfigCtrl;
      }());

      EndpointConfigCtrl.templateUrl = 'public/plugins/worldping-app/components/endpoint/partials/endpoint_config.html';

      _export("EndpointConfigCtrl", EndpointConfigCtrl);
    }
  };
});
//# sourceMappingURL=endpoint_config.js.map