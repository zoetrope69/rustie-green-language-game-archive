!(function (e) {
  if ("object" == typeof exports && "undefined" != typeof module) module.exports = e();
  else if ("function" == typeof define && define.amd) define([], e);
  else {
      var f;
      "undefined" != typeof window ? (f = window) : "undefined" != typeof global ? (f = global) : "undefined" != typeof self && (f = self), (f.GreenDreams = e());
  }
})(function () {
  var define, module, exports;
  return (function e(t, n, r) {
      function s(o, u) {
          if (!n[o]) {
              if (!t[o]) {
                  var a = typeof require == "function" && require;
                  if (!u && a) return a(o, !0);
                  if (i) return i(o, !0);
                  var f = new Error("Cannot find module '" + o + "'");
                  throw ((f.code = "MODULE_NOT_FOUND"), f);
              }
              var l = (n[o] = { exports: {} });
              t[o][0].call(
                  l.exports,
                  function (e) {
                      var n = t[o][1][e];
                      return s(n ? n : e);
                  },
                  l,
                  l.exports,
                  e,
                  t,
                  n,
                  r
              );
          }
          return n[o].exports;
      }
      var i = typeof require == "function" && require;
      for (var o = 0; o < r.length; o++) s(r[o]);
      return s;
  })(
      {
          1: [
              function (require, module, exports) {
                  function Clock(fps, maxMS) {
                      this.fps = fps;
                      this.frameMS = 1e3 / fps;
                      this.buffer = 0;
                      this.lastMS = 0;
                      this.maxMS = maxMS || 100;
                  }
                  Clock.prototype.tick = function () {
                      var now = Date.now();
                      var ms = now - this.lastMS;
                      this.lastMS = now;
                      if (ms > this.maxMS) return 0;
                      this.buffer += ms;
                      if (this.buffer >= this.frameMS) {
                          this.buffer -= this.frameMS;
                          return this.frameMS / 1e3;
                      }
                      return 0;
                  };
                  module.exports = Clock;
              },
              {},
          ],
          2: [
              function (require, module, exports) {
                  var EventEmitter = require("eventemitter2").EventEmitter2;
                  var PointerLock = require("./pointerlock");
                  var _ = require("lodash");
                  function Controls(canvas, turn) {
                      EventEmitter.call(this);
                      this.start = this.start.bind(this);
                      this.canvas = canvas;
                      this.sensitivity = 0.004;
                      this.state = { turn: turn || 0, tilt: 0, walk: 0, strafe: 0, jump: false };
                      this.codes = { 65: "strafeLeft", 68: "strafeRight", 87: "forward", 83: "backward", 32: "jump", 38: "forward", 40: "backward", 37: "left", 39: "right" };
                      this.keys = { forward: false, backward: false, left: false, right: false, strafeLeft: false, strafeRight: false, jump: false };
                      this.touchJump = false;
                      this.lastGamma = 0;
                      this.gamma = 0;
                      document.addEventListener("keydown", this.onKey.bind(this, true), false);
                      document.addEventListener("keyup", this.onKey.bind(this, false), false);
                      this.lock = new PointerLock(canvas);
                      this.lock.on("lock", this.onLock.bind(this));
                      this.lock.on("fail", this.onFail.bind(this));
                      this.lock.on("move", this.onLockMove.bind(this));
                      this.lock.on("release", this.onLockRelease.bind(this));
                      this.lock.on("error", this.onLockError.bind(this));
                      this.lock.on("legacyMove", this.onLegacyMove.bind(this));
                      this.touches = [];
                      canvas.addEventListener("touchstart", this.onTouchstart.bind(this), { passive: true });
                      canvas.addEventListener("touchmove", this.onTouchmove.bind(this), { passive: true });
                      canvas.addEventListener("touchend", this.onTouchend.bind(this), { passive: true });
                      window.addEventListener("deviceorientation", this.onDeviceOrientation.bind(this), false);
                  }
                  function bound(val, min, max) {
                      return Math.min(max, Math.max(min, val));
                  }
                  Controls.prototype = Object.create(EventEmitter.prototype);
                  Controls.prototype.onDeviceOrientation = function (e) {
                      this.orient(e.alpha, e.beta, (e.gamma * Math.PI) / 180 + Math.PI * 0.2);
                  };
                  Controls.prototype.orient = function (alpha, beta, gamma) {
                      this.state.tilt = bound(-gamma, -Math.PI * 0.4, Math.PI * 0.4);
                  };
                  Controls.prototype.getAverageGamma = function () {
                      var len = this.gammaHistory.length;
                      if (len === 0) return 0;
                      return (
                          this.gammaHistory.reduce(function (total, gamma) {
                              total += gamma;
                          }, 0) / this.gammaHistory.length
                      );
                  };
                  function copyTouch(touch) {
                      return { id: touch.identifier, ox: touch.pageX, oy: touch.pageY, x: touch.pageX, y: touch.pageY };
                  }
                  function updateTouch(touch, newTouch) {
                      touch.x = newTouch.pageX;
                      touch.y = newTouch.pageY;
                  }
                  Controls.prototype.onTouchstart = function (e) {
                      var width = this.canvas.clientWidth;
                      var touches = e.changedTouches;
                      var newTouch;
                      for (var i = 0; i < touches.length; i++) {
                          newTouch = copyTouch(touches[i]);
                          if (newTouch.ox > width * 0.6) {
                              this.touchJump = true;
                          } else {
                              this.touches.push(newTouch);
                          }
                      }
                      e.preventDefault();
                      e.stopPropagation();
                  };
                  Controls.prototype.onTouchmove = function (e) {
                      var touches = e.changedTouches;
                      for (var i = 0; i < touches.length; i++) {
                          var touch = _.find(this.touches, { id: touches[i].identifier });
                          if (touch) updateTouch(touch, touches[i]);
                      }
                      e.preventDefault();
                      e.stopPropagation();
                  };
                  Controls.prototype.onTouchend = function (e) {
                      var touches = e.changedTouches;
                      for (var i = 0; i < touches.length; i++) {
                          for (var j = 0; j < this.touches.length; j++) {
                              if (this.touches[j].id === touches[i].identifier) {
                                  this.touches.splice(j, 1);
                                  i--;
                              }
                          }
                      }
                      e.preventDefault();
                      e.stopPropagation();
                  };
                  Controls.prototype.start = function () {
                      if (this.lock.locked) return;
                      this.lock.request();
                  };
                  Controls.prototype.stop = function () {
                      if (this.lock.locked) this.lock.release();
                  };
                  Controls.prototype.update = function (seconds) {
                      var width = this.canvas.clientWidth;
                      if (this.keys.forward && !this.keys.backward) {
                          this.state.walk += 4 * seconds;
                      } else if (this.keys.backward && !this.keys.forward) {
                          this.state.walk -= 4 * seconds;
                      } else {
                          this.state.walk = 0;
                      }
                      if (this.keys.strafeLeft && !this.keys.strafeRight) {
                          this.state.strafe -= 4 * seconds;
                      } else if (this.keys.strafeRight && !this.keys.strafeLeft) {
                          this.state.strafe += 4 * seconds;
                      } else {
                          this.state.strafe = 0;
                      }
                      if (this.keys.left && !this.keys.right) {
                          this.state.turn -= seconds * 3;
                      } else if (this.keys.right && !this.keys.left) {
                          this.state.turn += seconds * 3;
                      }
                      for (var i = 0; i < this.touches.length; i++) {
                          var touch = this.touches[i];
                          var dx = touch.x - touch.ox;
                          var dy = touch.y - touch.oy;
                          if (touch.ox < width * 0.6) {
                              this.state.walk = Math.abs(dy) > 30 ? -dy / 40 : 0;
                              this.state.turn += (dx / 50) * seconds;
                          }
                      }
                      this.state.jump = this.touchJump || this.keys.jump;
                      this.touchJump = false;
                      this.state.walk = Math.max(-1, Math.min(1, this.state.walk));
                      this.state.strafe = Math.max(-1, Math.min(1, this.state.strafe));
                  };
                  Controls.prototype.getState = function () {
                      return this.state;
                  };
                  Controls.prototype.onLock = function () {
                      this.canvas.removeEventListener("click", this.start, false);
                      this.emit("ready");
                  };
                  Controls.prototype.onFail = function () {
                      this.canvas.removeEventListener("click", this.start, false);
                      this.emit("ready");
                  };
                  Controls.prototype.onLockMove = function (e) {
                    console.log('e', e)
                      this.state.turn += e.dx * this.sensitivity;
                      this.state.tilt = bound(this.state.tilt - e.dy * this.sensitivity, -Math.PI * 0.4, Math.PI * 0.4);
                  };
                  Controls.prototype.onLegacyMove = function (e) {
                      this.state.turn = (e.x / this.canvas.clientWidth) * Math.PI * 2;
                      this.state.tilt = (1 - e.y / this.canvas.clientHeight) * (Math.PI * 0.8) - Math.PI * 0.4;
                  };
                  Controls.prototype.onLockError = function () {
                      this.emit("ready");
                  };
                  Controls.prototype.onLockRelease = function () {
                      this.canvas.addEventListener("click", this.start, false);
                  };
                  Controls.prototype.onKey = function (val, e) {
                      var state = this.codes[e.keyCode];
                      if (typeof state === "undefined") return;
                      this.keys[state] = val;
                      e.preventDefault && e.preventDefault();
                      e.stopPropagation && e.stopPropagation();
                  };
                  module.exports = Controls;
              },
              { "./pointerlock": 8, eventemitter2: 12, lodash: 13 },
          ],
          3: [
              function (require, module, exports) {
                  function Cover(container, image, url) {
                      this.link = document.createElement("a");
                      var ls = this.link.style;
                      ls.display = "block";
                      ls.position = "absolute";
                      ls.top = ls.left = 0;
                      ls.width = ls.height = "100%";
                      ls.backgroundImage = 'url("' + image + '")';
                      ls.backgroundSize = "cover";
                      ls.backgroundRepeat = "no-repeat";
                      if (url) {
                          this.link.href = url;
                          this.link.target = "_blank";
                      }
                      container.appendChild(this.link);
                      this.hide();
                  }
                  module.exports = Cover;
                  Cover.prototype.hide = function () {
                      this.link.style.display = "none";
                  };
                  Cover.prototype.show = function () {
                      this.link.style.display = "block";
                  };
              },
              {},
          ],
          4: [
              function (require, module, exports) {
                  var Player = require("./player");
                  var World = require("./world");
                  var Controls = require("./controls");
                  var View = require("./view");
                  var Clock = require("./clock");
                  var StartButton = require("./startbutton");
                  var Cover = require("./cover");
                  var Music = require("./music");
                  var _ = require("lodash");
                  var DEFAULTS = {
                    upsample: 3,
                    link: "https://warp.net/products/52319-green-language",
                    fullscreen: false
                  };
                  function GreenDreams(container, options) {
                      options = _.extend({}, DEFAULTS, options);
                      this.running = false;
                      this.player = new Player(2, 55, 7);
                      this.world = new World(64);
                      this.clock = new Clock(30, 100);
                      container.style.position = "relative";
                      this.view = new View(container, options.upsample, options.fullscreen);
                      this.startCover = new Cover(container, options.start || "images/start.jpg");
                      this.endCover = new Cover(container, options.end || "images/end.jpg", options.link);
                      this.startButton = new StartButton(container);
                      this.controls = new Controls(this.view.getCanvas(), 0.25 * Math.PI);
                      this.music = new Music();
                      this.startCover.show();
                      this.music.once("ready", this.startButton.show.bind(this.startButton));
                      this.startButton.once("start", this.start.bind(this));
                      // this.startButton.once("start", this.controls.start.bind(this.controls));
                      // this.controls.once("ready", this.start.bind(this));
                  }
                  GreenDreams.prototype.start = function () {
                      if (this.running) return;
                      var self = this;
                      var world = self.world;
                      var player = self.player;
                      var view = self.view;
                      var clock = self.clock;
                      var music = self.music;
                      var controls = self.controls;
                      var seconds;
                      var action;
                      this.startCover.hide();
                      view.start();
                      controls.start();
                      this.music.play();
                      self.running = true;
                      requestAnimationFrame(frame);
                      function frame() {
                          if (!self.running) return;
                          while ((seconds = clock.tick())) {
                              player.update(controls.getState(), world, seconds);
                              controls.update(seconds);
                              action = player.getAction();
                              music.update(seconds, action);
                              if (action === "win") {
                                  self.stop();
                                  break;
                              }
                          }
                          view.render(world, player, music);
                          requestAnimationFrame(frame);
                      }
                  };
                  GreenDreams.prototype.stop = function () {
                      this.running = false;
                      this.controls.stop();
                      this.endCover.show();
                  };
                  module.exports = GreenDreams;
              },
              { "./clock": 1, "./controls": 2, "./cover": 3, "./music": 6, "./player": 7, "./startbutton": 9, "./view": 10, "./world": 11, lodash: 13 },
          ],
          5: [
              function (require, module, exports) {
                  var seedrandom = require("seedrandom");
                  var EMPTY = 0;
                  var WALL = 1;
                  var BORDER = 2;
                  var OUTSIDE = 3;
                  var DIRECTIONS = [
                      { dx: 0, dy: -1 },
                      { dx: 1, dy: 0 },
                      { dx: 0, dy: 1 },
                      { dx: -1, dy: 0 },
                  ];
                  function Maze(width, height, opts) {
                      opts = opts || {};
                      this.random = seedrandom(opts.seed || "banana");
                      this.randomly = this.randomly.bind(this);
                      this.width = width;
                      this.height = height;
                      this.startX = 0;
                      this.startY = height - 9;
                      this.endX = width - 1;
                      this.endY = 2;
                      this.grid = new Uint8Array(width * height);
                      this.generate();
                  }
                  module.exports = Maze;
                  Maze.prototype.get = function (x, y) {
                      if (x < 0 || x > this.width - 1 || y < 0 || y > this.height - 1) {
                          return OUTSIDE;
                      }
                      return this.grid[x + y * this.width];
                  };
                  Maze.prototype.set = function (x, y, val) {
                      this.grid[x + y * this.width] = val;
                  };
                  Maze.prototype.isStart = function (x, y) {
                      return x === this.startX && y === this.startY;
                  };
                  Maze.prototype.isEnd = function (x, y) {
                      return x === this.endX && y === this.endY;
                  };
                  Maze.prototype.isSpecial = function (x, y) {
                      return this.isStart(x, y) || this.isEnd(x, y);
                  };
                  Maze.prototype.randomly = function (a, b) {
                      return this.random() - 0.5;
                  };
                  Maze.prototype.generate = function () {
                      var blockable = [];
                      for (var y = 0; y < this.height; y++) {
                          for (var x = 0; x < this.width; x++) {
                              if ((y + x) % 2 === 1 && this.get(x, y) === EMPTY) {
                                  blockable.push({ x: x, y: y });
                              }
                          }
                      }
                      this.initialize();
                      this.addBlocks(blockable, this.solve());
                  };
                  Maze.prototype.addBlocks = function (blockable, preSolution) {
                      var i = blockable.length;
                      var postSolution;
                      var b;
                      blockable.sort(this.randomly);
                      while (i--) {
                          b = blockable[i];
                          if (preSolution.steps[b.x + b.y * this.width] === 1) {
                              blockable.splice(i, 1);
                              this.set(b.x, b.y, WALL);
                              postSolution = this.solve();
                              if (!(postSolution.solvable && postSolution.accessible)) this.set(b.x, b.y, EMPTY);
                              this.addBlocks(blockable, postSolution);
                              return;
                          }
                      }
                      var HANDICAP = 16;
                      while (blockable.length > HANDICAP) {
                          b = blockable.splice(0, 1)[0];
                          this.set(b.x, b.y, WALL);
                          postSolution = this.solve();
                          if (!(postSolution.solvable && postSolution.accessible)) this.set(b.x, b.y, EMPTY);
                      }
                  };
                  Maze.prototype.initialize = function () {
                      var x, y;
                      for (x = 0; x < this.width; x++) {
                          if (!this.isSpecial(x, 0)) this.set(x, 0, BORDER);
                          if (!this.isSpecial(x, this.height - 1)) this.set(x, this.height - 1, BORDER);
                      }
                      for (y = 0; y < this.height; y++) {
                          if (!this.isSpecial(0, y)) this.set(0, y, BORDER);
                          if (!this.isSpecial(this.width - 1, y)) this.set(this.width - 1, y, BORDER);
                      }
                      for (y = 2; y < this.height - 2; y += 2) {
                          for (x = 2; x < this.width - 2; x += 2) {
                              this.set(x, y, WALL);
                          }
                      }
                  };
                  Maze.prototype.solve = function () {
                      var self = this;
                      var queue = [{ x: self.startX, y: self.startY }];
                      var checked = new Uint8Array(self.width * self.height);
                      var solved = false;
                      var accessible = true;
                      do {
                          check(queue.shift());
                      } while (queue.length);
                      for (var y = 0; y < this.height; y++) {
                          for (var x = 0; x < this.width; x++) {
                              if (this.get(x, y) === EMPTY && checked[x + y * this.width] === 0) {
                                  accessible = false;
                              }
                          }
                      }
                      return { solvable: solved, steps: checked, accessible: accessible };
                      function check(current) {
                          checked[current.x + current.y * self.width] = solved ? 2 : 1;
                          if (self.isEnd(current.x, current.y)) solved = true;
                          else {
                              enqueue(current.x, current.y - 1);
                              enqueue(current.x, current.y + 1);
                              enqueue(current.x - 1, current.y);
                              enqueue(current.x + 1, current.y);
                          }
                      }
                      function enqueue(x, y) {
                          if (self.get(x, y) === EMPTY && !checked[x + y * self.width]) {
                              queue.push({ x: x, y: y });
                          }
                      }
                  };
              },
              { seedrandom: 14 },
          ],
          6: [
              function (require, module, exports) {
                  var EventEmitter = require("eventemitter2").EventEmitter2;
                  var _ = require("lodash");
                  var AREAS = {
                    "rustie-workship": true,
                    "rustie-up-down-ft-d-double-e": true,
                    "rustie-raptor": true,
                    "rustie-lost-ft-redinho": true,
                    "rustie-dream-on-ft-muhsinah": true
                  };
          
                  function Music() {
                      EventEmitter.call(this);
                      this.soundcloud = null;
                      this.sound = null;
                      this.defaultTrackId = "rustie-workship";
                      this.currentTrackId = null;
                      this.playing = false;
                      this.message = null;
                      this.messageSecs = 0;
                      this.tracks = [
                        {
                          "title":"Rustie - Workship",
                          "id":"rustie-workship"
                        },
                        { "title":"Rustie - A Glimpse",
                          "id":"rustie-a-glimpse"
                        },
                        {
                          "title":"Rustie - Raptor",
                          "id":"rustie-raptor"
                        },
                        {
                          "title":"Rustie - Paradise Stone",
                          "id":"rustie-paradise-stone"
                        },
                        {
                          "title":"Rustie - Up Down ft. D Double E",
                          "id":"rustie-up-down-ft-d-double-e"
                        },
                        {
                          "title":"Rustie - Attak ft. Danny Brown",
                          "id":"rustie-attak-ft-danny-brown"
                        },
                        {
                          "title":"Rustie - Tempest",
                          "id":"rustie-tempest"
                        }
                      ].map(track => {
                        return {
                          ...track,
                          unlocked: false
                        };
                      });

                      this.loadTrack(this.defaultTrackId, false);
                  }
                  module.exports = Music;
                  Music.prototype = Object.create(EventEmitter.prototype);
                  Music.prototype.loadTrack = function (id, playTrack = true) {
                      if (!id) throw new Error("track id cannot be null");
                      if (id === this.currentTrackId) return;
                      this.currentTrackId = id;
                      if (this.sound) {
                          this.sound.pause();
                          this.sound = null;
                      }

                      var track = _.find(this.tracks, { id: this.currentTrackId });

                      if (track) {
                          track.unlocked = true;
                          this.setMessage('"' + track.title + '"', 10);

                          const trackMp3Path = `./music/${track.id}.mp3`;
                          this.sound = new Audio(trackMp3Path);
                          this.sound.load();

                          this.sound.addEventListener("canplaythrough", () => {
                            
                            if (playTrack) {
                              this.sound.play();
                            }
                            this.emit("ready");
                          });

                          this.sound.addEventListener('ended', () => {
                            this.sound.pause();
                            this.sound = null;
                            this.loadTrack(this.getNextTrackId());
                          })
                      }
                  };
                  Music.prototype.getNextTrackId = function () {
                      for (var i = 0; i < this.tracks.length; i++) {
                          if (this.tracks[i].id === this.currentTrackId) {
                              for (var j = i + 1; j < this.tracks.length; j++) {
                                  if (this.tracks[j].unlocked) return this.tracks[j].id;
                              }
                              for (var j = 0; j < i; j++) {
                                  if (this.tracks[j].unlocked) return this.tracks[j].id;
                              }
                          }
                      }
                      return this.defaultTrackId;
                  };
                  Music.prototype.play = function () {
                      this.playing = true;
                      if (this.sound) {
                          this.sound.play();
                      }
                  };
                  Music.prototype.getMessage = function () {
                      var msg = this.message;
                      return msg;
                  };
                  Music.prototype.setMessage = function (message, secs) {
                      this.message = message;
                      this.messageSecs = secs;
                  };
                  Music.prototype.getUnlockedCount = function () {
                      return _.filter(this.tracks, { unlocked: true }).length;
                  };
                  Music.prototype.getTotalCount = function () {
                      return this.tracks.length;
                  };
                  Music.prototype.update = function (seconds, actionId) {
                      if (this.messageSecs > 0) {
                          this.messageSecs -= seconds;
                          if (this.messageSecs < 0) {
                              this.messageSecs = 0;
                              this.message = null;
                          }
                      }
                      if (actionId === "win") {
                          this.loadTrack("rustie-dream-on-ft-muhsinah");
                      } else if (actionId === "song-stone") {
                          for (var i = 0; i < this.tracks.length; i++) {
                              var t = this.tracks[i];
                              if (!t.unlocked && !AREAS[t.id]) return this.loadTrack(t.id);
                          }
                      } else if (actionId) {
                          this.loadTrack(actionId);
                      }
                  };
              },
              { eventemitter2: 12, lodash: 13 },
          ],
          7: [
              function (require, module, exports) {
                  var EventEmitter = require("eventemitter2").EventEmitter2;
                  var SOLID_BOUNDARY = 2;
                  function Player(x, y, z) {
                      EventEmitter.call(this);
                      this.startX = x;
                      this.startY = y;
                      this.startZ = z;
                      this.yRotation = 0;
                      this.xRotation = 0;
                      this.speed = 0;
                      this.maxSpeed = 4;
                      this.strafeSpeed = 0;
                      this.maxStrafeSpeed = 3;
                      this.fallSpeed = 0;
                      this.springSpeed = 0.45;
                      this.paces = 0;
                      this.lastStandingOn = 0;
                      this.flying = 0;
                      this.action = null;
                      this.pathPoints = 0;
                      this.last;
                      this.moveToStart();
                  }
                  Player.prototype = Object.create(EventEmitter.prototype);
                  Player.prototype.moveToStart = function () {
                      this.x = this.startX;
                      this.y = this.startY;
                      this.z = this.startZ;
                  };
                  Player.prototype.turn = function (angle) {
                      this.yRotation = angle;
                  };
                  Player.prototype.tilt = function (angle) {
                      this.xRotation = bound(angle, -Math.PI * 0.4, Math.PI * 0.4);
                  };
                  Player.prototype.move = function (distance, direction, world) {
                      var dx = Math.cos(direction) * distance;
                      var dz = Math.sin(direction) * distance;
                      if (world.get(this.x + dx, this.y, this.z) < SOLID_BOUNDARY) this.x += dx;
                      if (world.get(this.x, this.y, this.z + dz) < SOLID_BOUNDARY) this.z += dz;
                  };
                  Player.prototype.walk = function (percentSpeed, world) {
                      this.speed += (this.maxSpeed * percentSpeed - this.speed) * 0.5;
                      this.move(-this.speed, -this.yRotation - Math.PI * 0.5, world);
                      this.paces += this.speed;
                  };
                  Player.prototype.strafe = function (percentSpeed, world) {
                      this.strafeSpeed += (this.maxStrafeSpeed * percentSpeed - this.strafeSpeed) * 0.5;
                      this.move(this.strafeSpeed, -this.yRotation, world);
                  };
                  Player.prototype.fall = function (world) {
                      if (this.fallSpeed > 0.8) this.fallSpeed = 0.8;
                      var dy = this.fallSpeed >= 0 ? 1 : 0;
                      if (world.get(this.x, Math.floor(this.y + this.fallSpeed + dy), this.z) < SOLID_BOUNDARY) {
                          this.y += this.fallSpeed;
                      } else {
                          this.y = Math.floor(this.y + this.fallSpeed + 1 - dy);
                          this.fallSpeed = 0;
                      }
                      this.fallSpeed += world.gravity;
                  };
                  Player.prototype.jump = function (jumping, world) {
                      if (!jumping) return;
                      if (world.get(this.x, this.y + 1, this.z) < SOLID_BOUNDARY) return;
                      this.fallSpeed = -0.2;
                  };
                  Player.prototype.triggers = function (world, seconds) {
                      var standingOn = world.get(this.x, this.y + 1, this.z);
                      if (standingOn === 4) {
                          this.fallSpeed = -this.springSpeed;
                          this.action = "rustie-up-down-ft-d-double-e";
                      } else if (standingOn === 6) {
                          this.flying = 83;
                          this.action = "rustie-raptor";
                      } else if (standingOn === 7) {
                          this.action = "song-stone";
                          world.clearSongStones(this.x, this.y, this.z);
                      } else if (standingOn === 9) {
                          this.action = "win";
                      } else if (standingOn === 10) {
                          world.dirtyPath(this.x, this.y, this.z);
                          this.pathPoints = 0;
                      } else if (standingOn === 11) {
                          this.pathPoints += seconds;
                          if (this.pathPoints > 3) this.action = "rustie-lost-ft-redinho";
                      } else if (standingOn >= 21 && standingOn <= 23 && standingOn !== this.lastStandingOn) {
                          world.spinPuzzle(standingOn - 21, 1);
                      }
                      this.lastStandingOn = standingOn;
                  };
                  Player.prototype.fly = function (world, seconds) {
                      this.fallSpeed = 0;
                      this.move(-this.maxSpeed * seconds, -this.yRotation - Math.PI * 0.5, world);
                      var flightSpeed = -Math.cos((this.flying / 83) * Math.PI * 4.25) * 1.1 * seconds;
                      var dy = flightSpeed >= 0 ? 1 : 0;
                      if (world.get(this.x, Math.floor(this.y + this.fallSpeed + dy), this.z) < SOLID_BOUNDARY) {
                          this.y += flightSpeed;
                      } else {
                          this.y = Math.floor(this.y + this.fallSpeed + 1 - dy);
                      }
                      this.flying -= seconds;
                      if (this.flying < 0) this.flying = 0;
                  };
                  Player.prototype.wrap = function (world) {
                      this.x = (this.x + 63) % 63;
                      this.y = (this.y + 63) % 63;
                      this.z = (this.z + 63) % 63;
                  };
                  Player.prototype.update = function (controls, world, seconds) {
                      this.wrap(world);
                      this.turn(controls.turn);
                      this.tilt(controls.tilt);
                      if (this.flying) {
                          this.fly(world, seconds);
                          this.strafe(controls.strafe * seconds, world);
                      } else {
                          this.triggers(world, seconds);
                          this.walk(controls.walk * seconds, world);
                          this.strafe(controls.strafe * seconds, world);
                          this.jump(controls.jump, world);
                          this.fall(world);
                      }
                  };
                  Player.prototype.getAction = function () {
                      var action = this.action;
                      this.action = null;
                      return action;
                  };
                  module.exports = Player;
                  function bound(val, min, max) {
                      return Math.min(max, Math.max(min, val));
                  }
              },
              { eventemitter2: 12 },
          ],
          8: [
              function (require, module, exports) {
                  var EventEmitter = require("eventemitter2").EventEmitter2;
                  var PREFIXES = ["webkit", "moz", "ms", "o"];
                  var NOOP = function () {};
                  function PointerLock(el) {
                      EventEmitter.call(this);
                      this.onMove = this.onMove.bind(this);
                      this.el = el;
                      this.locked = false;
                      document.addEventListener('pointerlockchange', this.onChange.bind(this), false);
                      document.addEventListener('pointerlockerror', this.onError.bind(this), false);
                  }
                  module.exports = PointerLock;
                  PointerLock.prototype = Object.create(EventEmitter.prototype);
                  PointerLock.prototype.request = function () {
                      this.el.addEventListener("mousemove", this.onMove, false);
                      this.el.requestPointerLock();
                  };
                  PointerLock.prototype.release = function () {
                    document.exitPointerLock();
                  };
                  PointerLock.prototype.onChange = function () {
                    console.log('change?');
                      if (document.pointerLockElement === this.el) {
                          if (this.locked) return;
                          this.locked = true;
                          this.emit("lock");
                      } else {
                          if (!this.locked) return;
                          this.locked = false;
                          this.emit("release");
                      }
                  };
                  PointerLock.prototype.onMove = function (e) {
                      if (this.locked) {
                        this.emit("move", { dx: e.movementX || 0, dy: e.movementY || 0 });
                      } else {
                        this.emit("legacyMove", { x: e.pageX, y: e.pageY });
                      }
                  };
                  PointerLock.prototype.onError = function (e) {
                    console.log('error', e);
                      this.emit("error", e);
                  };
              },
              { eventemitter2: 12 },
          ],
          9: [
              function (require, module, exports) {
                  var EventEmitter = require("eventemitter2").EventEmitter2;
                  function StartButton(container) {
                      EventEmitter.call(this);
                      this.button = document.createElement("button");
                      this.button.innerHTML = "Start";
                      this.button.className = "button--start";
                      this.hide();
                      this.button.addEventListener("click", this.onClick.bind(this), false);
                      container.appendChild(this.button);
                  }
                  module.exports = StartButton;
                  StartButton.prototype = Object.create(EventEmitter.prototype);
                  StartButton.prototype.show = function () {
                      this.button.style.display = "block";
                  };
                  StartButton.prototype.hide = function () {
                      this.button.style.display = "none";
                  };
                  StartButton.prototype.onClick = function (e) {
                      this.emit("start");
                      this.hide();
                  };
              },
              { eventemitter2: 12 },
          ],
          10: [
              function (require, module, exports) {
                  var _ = require("lodash");
                  function pixelCanvas(ctx) {
                      ctx.mozImageSmoothingEnabled = false;
                      ctx.webkitImageSmoothingEnabled = false;
                      ctx.msImageSmoothingEnabled = false;
                      ctx.imageSmoothingEnabled = false;
                  }
                  function View(container, upsampling, fullscreen) {
                      this.upsampling = upsampling || 2;
                      this.fullscreen = fullscreen;
                      this.focalLength = 1;
                      this.range = 28;
                      this.container = container;
                      this.canvas = document.createElement("canvas");
                      this.ctx = this.canvas.getContext("2d");
                      this.bigCanvas = document.createElement("canvas");
                      this.bigCtx = this.bigCanvas.getContext("2d");
                      container.appendChild(this.bigCanvas);
                      this.resize();
                      window.addEventListener("resize", _.debounce(this.resize.bind(this), 250), true);
                      this.bigCanvas.addEventListener("click", this.start.bind(this), false);
                  }
                  View.prototype.start = function () {
                      if (this.fullscreen) requestFullscreen(this.container);
                  };
                  View.prototype.getCanvas = function () {
                      return this.bigCanvas;
                  };
                  View.prototype.resize = function () {
                      var canvas = this.canvas;
                      var fullWidth = this.container.clientWidth;
                      var fullHeight = this.container.clientHeight;
                      var pixels = fullWidth * fullHeight;
                      var upsampling = pixels < 2e5 ? 3 : 3;
                      this.width = canvas.width = (fullWidth >> upsampling) | 0;
                      this.height = canvas.height = (fullHeight >> upsampling) | 0;
                      this.bigCanvas.width = fullWidth;
                      this.bigCanvas.height = fullHeight;
                      this.bigCtx.font = this.bigCanvas.width < 1024 ? "24px sans-serif" : "42px sans-serif";
                      pixelCanvas(this.ctx);
                      pixelCanvas(this.bigCtx);
                      this.pixels = this.ctx.createImageData(this.width, this.height);
                      for (var i = 0; i < this.width * this.height; i++) {
                          this.pixels.data[i * 4 + 3] = 255;
                      }
                  };
                  View.prototype.render = function (world, player, music) {
                      this.renderWorld(world, player);
                      this.bigCtx.drawImage(this.canvas, 0, 0, this.width, this.height, 0, 0, this.bigCanvas.width, this.bigCanvas.height);
                      this.renderMessage(music.getMessage());
                      this.renderSongs(music.getUnlockedCount(), music.getTotalCount());
                  };
                  View.prototype.renderDebug = function (player) {
                      var ctx = this.bigCtx;
                      var x = player.x.toFixed(0);
                      var y = player.y.toFixed(0);
                      var z = player.z.toFixed(0);
                      var location = ["x: " + x, "z: " + z, "y: " + y].join(", ");
                      var direction = player.yRotation;
                      while (direction < 0) direction += Math.PI * 2;
                      while (direction > Math.PI * 2) direction -= Math.PI * 2;
                      direction /= Math.PI;
                      var heading;
                      if (direction > 0.25 && direction <= 0.75) heading = "E";
                      else if (direction > 0.75 && direction <= 1.25) heading = "S";
                      else if (direction > 1.25 && direction < 1.75) heading = "W";
                      else heading = "N";
                      var compass = heading + " (" + direction.toFixed(2) + ")";
                      ctx.textBaseline = "top";
                      ctx.textAlign = "left";
                      ctx.fillStyle = "#000000";
                      ctx.fillText(location, 16, 17);
                      ctx.fillText(heading, 16, 57);
                      ctx.fillStyle = "#ffffff";
                      ctx.fillText(location, 16, 16);
                      ctx.fillText(compass, 16, 56);
                  };
                  View.prototype.renderMessage = function (message) {
                      if (!message) return;
                      message = message.toUpperCase();
                      var ctx = this.bigCtx;
                      var x = this.bigCanvas.width * 0.5;
                      var y = this.bigCanvas.height * 0.8;
                      ctx.textBaseline = "bottom";
                      ctx.textAlign = "center";
                      ctx.fillStyle = "#000000";
                      ctx.fillText(message, x, y);
                      ctx.fillStyle = "#ffffff";
                      ctx.fillText(message, x, y);
                  };
                  View.prototype.renderSongs = function (found, available) {
                      var ctx = this.bigCtx;
                      var x = 32;
                      var y = 32;
                      var message = "♫ " + found + "/" + available;
                      ctx.textBaseline = "top";
                      ctx.textAlign = "left";
                      ctx.fillStyle = "#000000";
                      ctx.fillText(message, x, y);
                      ctx.fillStyle = "#ffffff";
                      ctx.fillText(message, x, y);
                  };
                  View.prototype.renderWorld = function (world, viewpoint) {
                      var w = this.width;
                      var h = this.height;
                      var range = this.range;
                      var size = world.size;
                      var pixels = this.pixels;
                      var ctx = this.ctx;
                      var orig = [viewpoint.y, viewpoint.x, viewpoint.z];
                      var xRot = viewpoint.xRotation;
                      var xSin = Math.sin(xRot);
                      var xCos = Math.cos(xRot);
                      var yRot = viewpoint.yRotation;
                      var ySin = Math.sin(yRot);
                      var yCos = Math.cos(yRot);
                      var x, y;
                      var tx, ty, tz;
                      var tx1, ty1, tz1;
                      var t2 = [0, 0, 0];
                      var grid = world.grid;
                      var texmap = world.texmap;
                      var axis, offset, primary;
                      var dx, dy, dz;
                      var scale;
                      var xp, yp, zp;
                      var dist, closest;
                      var texture;
                      var r, g, b;
                      var u, v;
                      var rayColor, skyColor, color;
                      var vis, bright;
                      tz = this.focalLength;
                      for (y = 0; y < h; y++) {
                          ty = (y - h / 2) / h;
                          for (x = 0; x < w; x++) {
                              tx = (x - w / 2) / h;
                              tx1 = tx;
                              ty1 = ty * xCos - tz * xSin;
                              tz1 = ty * xSin + tz * xCos;
                              t2[0] = ty1;
                              t2[1] = tz1 * ySin + tx1 * yCos;
                              t2[2] = tz1 * yCos - tx1 * ySin;
                              closest = range;
                              var skyAngle = 1 - (ty1 < 0 ? -ty1 : ty1);
                              skyColor = (255 << 16) | (((17 + 153 * skyAngle) & 255) << 8) | ((51 + 68 * skyAngle) & 255);
                              bright = 1;
                              color = skyColor;
                              for (axis = 0; axis < 3; axis++) {
                                  primary = t2[axis];
                                  scale = 1 / (primary < 0 ? -primary : primary);
                                  dy = t2[0] * scale;
                                  dx = t2[1] * scale;
                                  dz = t2[2] * scale;
                                  offset = orig[axis] - (orig[axis] | 0);
                                  if (primary > 0) offset = 1 - offset;
                                  dist = scale * offset;
                                  yp = orig[0] + dy * offset;
                                  xp = orig[1] + dx * offset;
                                  zp = orig[2] + dz * offset;
                                  if (primary < 0) {
                                      if (axis === 0) yp--;
                                      else if (axis === 1) xp--;
                                      else if (axis === 2) zp--;
                                  }
                                  xp = (xp + 63) % 63;
                                  zp = (zp + 63) % 63;
                                  while (dist < closest) {
                                      texture = grid[((zp & 63) << 12) | ((yp & 63) << 6) | (xp & 63)];
                                      if (texture > 0) {
                                          if (yp >= 0 && yp < size) {
                                              u = ((xp + zp) * 16) & 15;
                                              v = ((yp * 16) & 15) + 16;
                                              if (axis === 0) {
                                                  u = (xp * 16) & 15;
                                                  v = (zp * 16) & 15;
                                              }
                                              rayColor = texmap[u + v * 16 + (texture - 1) * 16 * 16 * 2];
                                              if (rayColor > 0) {
                                                  color = rayColor;
                                                  closest = dist;
                                                  bright = 1 - (axis % 3) / 6;
                                              }
                                          }
                                      }
                                      yp += dy;
                                      xp = (xp + dx + 63) % 63;
                                      zp = (zp + dz + 63) % 63;
                                      dist += scale;
                                  }
                              }
                              vis = 1 - closest / range;
                              r = ((color >> 16) & 255) * vis + ((skyColor >> 16) & 255) * (1 - vis);
                              g = ((color >> 8) & 255) * vis + ((skyColor >> 8) & 255) * (1 - vis);
                              b = (color & 255) * vis + (skyColor & 255) * (1 - vis);
                              pixels.data[(x + y * w) * 4 + 0] = r * bright;
                              pixels.data[(x + y * w) * 4 + 1] = g * bright;
                              pixels.data[(x + y * w) * 4 + 2] = b * bright;
                          }
                      }
                      ctx.putImageData(pixels, 0, 0);
                  };
                  module.exports = View;
                  function requestFullscreen(el) {
                      (el.requestFullScreen || el.msRequestFullscreen || el.mozRequestFullScreen || el.webkitRequestFullscreen || function () {}).call(el);
                  }
              },
              { lodash: 13 },
          ],
          11: [
              function (require, module, exports) {
                  var Simplex = require("simplex-noise");
                  var seedrandom = require("seedrandom");
                  var Maze = require("./maze");
                  var TEXTURE_COUNT = 23;
                  var OWL_HEAD = [
                      "................",
                      "..X..........X..",
                      "..XX........XX..",
                      "..X.XXXXXXXX.X..",
                      "..X..........X..",
                      "..X.XXX..XXX.X..",
                      "..XX...XX...XX..",
                      "..X..X....X..X..",
                      "..X.XXX..XXX.X..",
                      "..X..X....X..X..",
                      "..XX........XX..",
                      "..X.XXXXXXXX.X..",
                      "..X...X..X...X..",
                      ".X.X..X..X..X.X.",
                      ".X.X...XX...X.X.",
                      ".X..X......X..X.",
                  ].join("");
                  var OWL_BODY = [
                      ".X.X.X....X.X.X.",
                      ".X.X..XXXX..X.X.",
                      ".X.X...XX...X.X.",
                      "..XX........XX..",
                      "..X.X......X.X..",
                      "...XX......XX...",
                      "...XX......XX...",
                      "...X.X....X.X...",
                      "...X.X....X.X...",
                      "...X..X..X..X...",
                      "....X..XX..X....",
                      "....X......X....",
                      "....XX....XX....",
                      "...X.XX..X..X...",
                      "XXXX.X.XXX..XXXX",
                      "..X..X.X.X...X..",
                  ].join("");
                  var OWL_FOOT = [
                      "..X.XX.X.XX..X..",
                      "...X.X.X.X.XX...",
                      ".....X.X.X......",
                      ".....X.X.X......",
                      "......X.X.......",
                      "................",
                      "................",
                      "................",
                      "................",
                      "................",
                      "................",
                      "................",
                      "................",
                      "................",
                      "................",
                      "................",
                  ].join("");
                  var COYOTE_HEAD = [
                      "................",
                      "................",
                      "..........XXXX..",
                      "..........X..X..",
                      "..........X..X..",
                      "...XXXXXXXX..X..",
                      "...X.........X..",
                      "...XXXXX..X..X..",
                      ".......X..X..X..",
                      "...XXXXX.....X..",
                      "...X.........X..",
                      "...XXXXX.....X..",
                      ".......X.....X..",
                      ".......X.....X..",
                      ".......X.....X..",
                      ".......X.....X..",
                  ].join("");
                  var COYOTE_BODY = [
                      "..XXXXXX.....X..",
                      "..X..........X..",
                      "..X..........X..",
                      "..X.XXXX.....X..",
                      "..X.X..X.....X..",
                      "..X.X..X.....X..",
                      "..XXX..X.....X..",
                      ".......X.....X..",
                      ".......X.....X..",
                      ".......X.....X..",
                      ".......X.....X..",
                      ".......X.....X..",
                      ".......X.....X..",
                      ".......X.....X..",
                      ".......X.....X..",
                      ".......X.....X..",
                  ].join("");
                  var COYOTE_FOOT = [
                      ".......X.....X..",
                      ".......X.....X..",
                      ".......X.....X..",
                      ".......X.....X..",
                      ".......X.....X..",
                      ".......X.....X..",
                      ".......X.....X..",
                      ".......X.....X..",
                      "...XXXXX.....X..",
                      "...X.........X..",
                      "...X.........X..",
                      "...X.XXXXXX..XXX",
                      "...X.X....X.....",
                      "...X.X....X.....",
                      "...XXX....XXXXXX",
                      "................",
                  ].join("");
                  function World(size, seed) {
                      this.random = seedrandom(seed || "monkey");
                      this.simplex = new SimplexNoise(this.random);
                      this.gravity = 0.01;
                      this.puzzle = [2, 0, 0];
                      this.puzzleHeadTextures = [12, 13, 14];
                      this.puzzleBodyTextures = [15, 16, 17];
                      this.puzzleFootTextures = [18, 19, 20];
                      this.puzzleSolved = false;
                      this.size = size;
                      this.grid = new Uint8Array(size * size * size);
                      this.texmap = new Uint32Array(16 * 16 * 2 * TEXTURE_COUNT);
                      this.createTexture(1, this.leafTexture);
                      this.createTexture(2, this.grassTexture);
                      this.createTexture(3, this.stoneTexture);
                      this.createTexture(4, this.springTexture);
                      this.createTexture(5, this.barkTexture);
                      this.createTexture(6, this.flightTexture);
                      this.createTexture(7, this.songTexture);
                      this.createTexture(8, this.deadSongTexture);
                      this.createTexture(9, this.winTexture);
                      this.createTexture(10, this.cleanPathTexture);
                      this.createTexture(11, this.dirtyPathTexture);
                      this.createTexture(12, this.lizardHeadTexture);
                      this.createTexture(13, this.owlHeadTexture);
                      this.createTexture(14, this.coyoteHeadTexture);
                      this.createTexture(15, this.lizardBodyTexture);
                      this.createTexture(16, this.owlBodyTexture);
                      this.createTexture(17, this.coyoteBodyTexture);
                      this.createTexture(18, this.lizardFootTexture);
                      this.createTexture(19, this.owlFootTexture);
                      this.createTexture(20, this.coyoteFootTexture);
                      this.cloneTexture(3, 21);
                      this.cloneTexture(3, 22);
                      this.cloneTexture(3, 23);
                      this.createSurface(32, 63, 32, { radius: 50, peaks: 5, roughness: 2, springs: 0.02, trees: 0.07 });
                      this.createTower(30, 54, 34);
                      this.createSongStone(50, 56, 24);
                      this.createSongStone(43, 60, 57);
                      this.createSongStone(60, 59, 8);
                      this.createSongStone(19, 58, 62);
                      this.createSpring(27, 54, 6);
                      this.createIsland(36, 45, 6, { radius: 4, peaks: 1, springs: 0.001 });
                      this.createSpring(36, 44, 6);
                      this.createIsland(46, 36, 6, { radius: 4, peaks: 1, springs: 0.001 });
                      this.createSpring(46, 35, 6);
                      this.createIsland(46, 35, -20, { radius: 4, peaks: 1 });
                      for (var z = 0; z > -18; z -= 2) {
                          this.set(46, 36, z, 3);
                      }
                      this.createSongStone(46, 35, -20);
                      this.createIsland(71, 36, 6, { radius: 16, peaks: 1 });
                      this.createMaze(61, -4, 81, 16, 35, {});
                      this.set(8, 36, 27, 3);
                      this.createIsland(8, 36, 35, { radius: 3, peaks: 1 });
                      this.createSongStone(8, 36, 35);
                      this.createSongStone(71, 27, 6);
                      this.createFlight(71, 31, 6);
                      this.createIsland(42, 28, 37, { radius: 20, peaks: 1 });
                      this.createPyramid(29, 24, 55, 50, 27, {});
                      for (var x = 42 - 2; x <= 42 + 2; x++) {
                          for (var z = 37 - 2; z <= 37 + 2; z++) {
                              this.set(x, 27, z, 3);
                          }
                      }
                      for (var y = 28; y < 35; y++) {
                          for (var x = 34 - 1; x <= 34 + 1; x++) {
                              for (var z = 29 - 1; z <= 29 + 1; z++) {
                                  this.set(x, y, z, 0);
                              }
                          }
                      }
                      this.drawPuzzle();
                  }
                  World.prototype.drawPuzzle = function () {
                      var s = 2;
                      for (var x = 50 - s; x <= 50 + s; x++) {
                          for (var z = 29 - s; z <= 29 + s; z++) {
                              this.set(x, 28, z, 21);
                          }
                      }
                      this.set(50, 25, 29, this.puzzleHeadTextures[(0 + this.puzzle[0]) % 3]);
                      this.set(50, 26, 29, this.puzzleBodyTextures[(0 + this.puzzle[1]) % 3]);
                      this.set(50, 27, 29, this.puzzleFootTextures[(0 + this.puzzle[2]) % 3]);
                      for (var x = 50 - s; x <= 50 + s; x++) {
                          for (var z = 45 - s; z <= 45 + s; z++) {
                              this.set(x, 28, z, 22);
                          }
                      }
                      this.set(50, 25, 45, this.puzzleHeadTextures[(1 + this.puzzle[0]) % 3]);
                      this.set(50, 26, 45, this.puzzleBodyTextures[(1 + this.puzzle[1]) % 3]);
                      this.set(50, 27, 45, this.puzzleFootTextures[(1 + this.puzzle[2]) % 3]);
                      for (var x = 34 - s; x <= 34 + s; x++) {
                          for (var z = 45 - s; z <= 45 + s; z++) {
                              this.set(x, 28, z, 23);
                          }
                      }
                      this.set(34, 25, 45, this.puzzleHeadTextures[(2 + this.puzzle[0]) % 3]);
                      this.set(34, 26, 45, this.puzzleBodyTextures[(2 + this.puzzle[1]) % 3]);
                      this.set(34, 27, 45, this.puzzleFootTextures[(2 + this.puzzle[2]) % 3]);
                      if (this.puzzle[0] === this.puzzle[1] && this.puzzle[1] === this.puzzle[2]) {
                          this.createWinStone(42, 27, 37);
                          this.puzzleSolved = true;
                      }
                  };
                  World.prototype.spinPuzzle = function (i, spin) {
                      if (this.puzzleSolved) return;
                      this.puzzle[i] = (this.puzzle[i] + spin) % 3;
                      this.drawPuzzle();
                  };
                  World.prototype.createTower = function (x1, y1, z1) {
                      var y;
                      for (y = y1; y > y1 - 16; y--) {
                          this.set(x1, y, z1 - 1, 3);
                          this.set(x1, y, z1 + 1, 3);
                          this.set(x1 - 1, y, z1, 3);
                          this.set(x1 + 1, y, z1, 3);
                      }
                      this.set(x1, y, z1, 3);
                      for (y = y1; y > y1 - 3; y--) {
                          this.set(x1, y, z1 - 4, 3);
                          this.set(x1, y, z1 + 4, 3);
                          this.set(x1 + 4, y, z1, 3);
                          this.set(x1 - 4, y, z1 - 2, 3);
                          this.set(x1 - 4, y, z1 + 2, 3);
                      }
                      for (var z = z1 - 3; z <= z1 + 3; z++) {
                          this.set(x1 - 4, y, z, 3);
                      }
                  };
                  World.prototype.createSongStone = function (x1, y, z1) {
                      this.set(x1, y - 1, z1, 7);
                      this.set(x1, y - 2, z1, 7);
                      for (var x = x1 - 1; x <= x1 + 1; x++) {
                          for (var z = z1 - 1; z <= z1 + 1; z++) {
                              this.set(x, y, z, 7);
                          }
                      }
                  };
                  World.prototype.createWinStone = function (x1, y, z1) {
                      this.set(x1, y - 1, z1, 9);
                      this.set(x1, y - 2, z1, 9);
                      for (var x = x1 - 1; x <= x1 + 1; x++) {
                          for (var z = z1 - 1; z <= z1 + 1; z++) {
                              this.set(x, y, z, 9);
                          }
                      }
                  };
                  World.prototype.createSpring = function (x1, y1, z1) {
                      for (var x = x1 - 1; x <= x1 + 1; x++) {
                          for (var z = z1 - 1; z <= z1 + 1; z++) {
                              this.set(x, y1, z, 3);
                          }
                      }
                      this.set(x1, y1, z1, 4);
                  };
                  World.prototype.createFlight = function (x1, y1, z1) {
                      for (var x = x1 - 1; x <= x1 + 1; x++) {
                          for (var z = z1 - 1; z <= z1 + 1; z++) {
                              this.set(x, y1, z, 3);
                          }
                      }
                      this.set(x1, y1, z1, 6);
                  };
                  World.prototype.createMaze = function (x1, z1, x2, z2, y1, opts) {
                      var dx = x2 - x1;
                      var dz = z2 - z1;
                      var maze = new Maze(19, 19);
                      for (var y = y1; y > y1 - 4; y--) {
                          for (var x = 0; x < 19; x++) {
                              for (var z = 0; z < 19; z++) {
                                  this.set(x1 + x, y1 + 1, z1 + z, 10);
                                  if (maze.get(x, z) > 0) {
                                      this.set(x1 + x, y, z1 + z, 3);
                                  }
                              }
                          }
                          for (var x = 19; x < 22; x++) {
                              this.set(x1 + x, y, z1, 3);
                              this.set(x1 + x, y, z1 + 18, 3);
                          }
                          for (var z = 0; z < 19; z++) {
                              this.set(x1 + 22, y, z1 + z, 3);
                          }
                          for (var z = 0; z < 4 - (y1 - y); z++) {
                              for (var x = 19; x < 22; x++) {
                                  this.set(x1 + x, y, z1 + 18 - z, 3);
                              }
                          }
                      }
                      for (var y = y1 - 4; y >= y1 - 8; y--) {
                          for (var x = x1 + 6; x <= x2 - 6; x++) {
                              for (var z = z1 + 6; z <= z2 - 6; z++) {
                                  if (y === y1 - 4 || y === y1 - 8) {
                                      this.set(x, y, z, 3);
                                      this.set(x, y, z, 3);
                                  } else if (x === x1 + 8 || x === x2 - 8) {
                                      if (z === z1 + 8 || z === z2 - 8) {
                                          this.set(x, y, z, 3);
                                      }
                                  }
                              }
                          }
                      }
                  };
                  World.prototype.createPyramid = function (x1, z1, x2, z2, y1, opts) {
                      var y = y1 + 1;
                      for (var x = x1; x <= x2; x++) {
                          for (var z = z1; z <= z2; z++) {
                              this.set(x, y, z, 3);
                              if (x === x1 || x === x2 || z === z1 || z === z2) {
                                  this.set(x, y - 1, z, 3);
                                  this.set(x, y - 2, z, 3);
                              } else if (x <= x1 + 2 || x >= x2 - 2 || z <= z1 + 2 || z >= z2 - 2) {
                                  this.set(x, y - 1, z, 3);
                                  this.set(x, y - 2, z, 5);
                              }
                          }
                      }
                      x1++;
                      x2--;
                      z1++;
                      z2--;
                      x1++;
                      x2--;
                      z1++;
                      z2--;
                      y -= 3;
                      while (x2 > x1 && z2 > z1) {
                          for (var x = x1; x <= x2; x++) {
                              this.set(x, y, z1, 3);
                              this.set(x, y, z2, 3);
                          }
                          for (var z = z1; z <= z2; z++) {
                              this.set(x1, y, z, 3);
                              this.set(x2, y, z, 3);
                          }
                          x1++;
                          x2--;
                          z1++;
                          z2--;
                          y--;
                      }
                  };
                  World.prototype.set = function (x, y, z, texture) {
                      x = (x + 63) % 63;
                      y = (y + 63) % 63;
                      z = (z + 63) % 63;
                      this.grid[((z & 63) << 12) | ((y & 63) << 6) | (x & 63)] = texture;
                  };
                  World.prototype.get = function (x, y, z) {
                      x = (x + 63) % 63;
                      y = (y + 63) % 63;
                      z = (z + 63) % 63;
                      return this.grid[((z & 63) << 12) | ((y & 63) << 6) | (x & 63)];
                  };
                  World.prototype.clearSongStones = function (x1, y1, z1) {
                      x1 = Math.floor(x1);
                      y1 = Math.floor(y1);
                      z1 = Math.floor(z1);
                      for (var x = x1 - 3; x <= x1 + 3; x++) {
                          for (var y = y1 - 3; y <= y1 + 3; y++) {
                              for (var z = z1 - 3; z <= z1 + 3; z++) {
                                  if (this.get(x, y, z) === 7) {
                                      this.set(x, y, z, 8);
                                  }
                              }
                          }
                      }
                  };
                  World.prototype.dirtyPath = function (x, y1, z) {
                      var path = this.get(x, y1 + 1, z);
                      if (path === 10) this.set(x, y1 + 1, z, 11);
                  };
                  World.prototype.createTexture = function (index, fn) {
                      var texmap = this.texmap;
                      var offset = (index - 1) * 16 * 16 * 2;
                      for (var y = 0; y < 16; y++) {
                          for (var x = 0; x < 16; x++) {
                              texmap[x + y * 16 + offset] = fn.call(this, x, y, true);
                              texmap[x + (y + 16) * 16 + offset] = fn.call(this, x, y, false);
                          }
                      }
                  };
                  World.prototype.cloneTexture = function (from, to) {
                      var texmap = this.texmap;
                      var fromOff = (from - 1) * 16 * 16 * 2;
                      var toOff = (to - 1) * 16 * 16 * 2;
                      for (var y = 0; y < 32; y++) {
                          for (var x = 0; x < 16; x++) {
                              texmap[x + y * 16 + toOff] = texmap[x + y * 16 + fromOff];
                          }
                      }
                  };
                  World.prototype.grassTexture = function (x, y, top) {
                      if (top) {
                          if (this.random() < 0.1) return 6204236;
                          return 4752488;
                      } else {
                          if (this.random() * 5 > y) return 3435601;
                          else if (x % 2 === 0 && this.random() < 0.2) return 7300192;
                          return 8352880;
                      }
                  };
                  World.prototype.stoneTexture = function (x, y, top) {
                      if (top) {
                          if (this.random() < 0.2) return 11578818;
                          if (x === 0 || y === 0) return 7501991;
                          return 9013176;
                      } else {
                          if ((x + y) % 8 === 0 && this.random() < 0.5) return 7501991;
                          if (x % 3 === 0 && this.random() < 0.1) return 12633046;
                          if (x === 0) return 7501991;
                          return 9013176;
                      }
                  };
                  World.prototype.cleanPathTexture = function (x, y, top) {
                      if (top) {
                          if (this.random() < Math.abs(x - 8 + y - 8) / 12) {
                              return this.random() < 0.2 ? 6204236 : 4752488;
                          }
                          if (x < 1 || x > 14 || y < 1 || y > 14) {
                              return 4139543;
                          }
                          return 6374714;
                      } else {
                          return 4139543;
                      }
                  };
                  World.prototype.dirtyPathTexture = function (x, y, top) {
                      if (top) {
                          if (this.random() < Math.abs(x - 8 + y - 8) / 18) {
                              return this.random() < 0.2 ? 6204236 : 4752488;
                          }
                          if (x < 1 || x > 14 || y < 1 || y > 14) {
                              return 4139543;
                          }
                          if (this.random() < 0.8) {
                              return 4139543;
                          }
                          return 6374714;
                      } else {
                          return 4139543;
                      }
                  };
                  World.prototype.springTexture = function (x, y, top) {
                      if (top) {
                          var dx = x - 7.5;
                          var dy = y - 7.5;
                          var dist = Math.sqrt(dx * dx + dy * dy);
                          if (dist > 7) return 5909577;
                          return Math.floor(dist / 2) % 2 === 0 ? 5909577 : 16766516;
                      } else {
                          return 5909577;
                      }
                  };
                  World.prototype.flightTexture = function (x, y, top) {
                      if (top) {
                          var dx = x - 7.5;
                          var dy = y - 7.5;
                          var dist = Math.sqrt(dx * dx + dy * dy);
                          if (dist > 7) return 5909577;
                          return Math.floor(dist / 2) % 2 === 0 ? 5909577 : 16766516;
                      } else {
                          return 5909577;
                      }
                  };
                  World.prototype.barkTexture = function (x, y, top) {
                      if (top) {
                          var dx = x - 7.5;
                          var dy = y - 7.5;
                          var dist = Math.floor(Math.sqrt(dx * dx + dy * dy));
                          return dist % 2 === 0 ? 5322802 : 4270114;
                      } else {
                          if (Math.floor(x / 2) % 2 === 0) {
                              if (this.random() < 0.3) return 8612184;
                              if (this.random() < 0.3) return 8681067;
                              if (this.random() < 0.4) return 5516590;
                          }
                          return 5322802;
                      }
                  };
                  World.prototype.leafTexture = function (x, y, top) {
                      if (x === 0 || y === 0 || x === 15 || y === 15) return 0;
                      if (this.random() < 0.5) {
                          return this.random() < 0.25 ? 5373875 : 4321187;
                      }
                      return 0;
                  };
                  function match(x, y, pairs) {
                      if (x > 7) x = 15 - x;
                      for (var i = 0; i < pairs.length; i += 2) {
                          if (x === pairs[i] && y === 16 - pairs[i + 1]) {
                              return true;
                          }
                      }
                      return false;
                  }
                  function light() {
                      return Math.random() < 0.5 ? 12303291 : 14540253;
                  }
                  function dark() {
                      return Math.random() < 0.1 ? 3355443 : 1118481;
                  }
                  World.prototype.lizardHeadTexture = function (x, y, top) {
                      if (match(x, y, [6, 0, 5, 1, 4, 2, 4, 3, 3, 4, 3, 5, 3, 6, 3, 7, 4, 8, 4, 9, 5, 10, 6, 11, 7, 12, 6, 7, 6, 8])) return light();
                      return dark(x, y);
                  };
                  World.prototype.lizardBodyTexture = function (x, y, top) {
                      if (x === 6 || x === 9) return light();
                      if (match(x, y, [6, 11, 5, 11, 4, 11, 4, 12, 4, 13, 4, 14, 3, 12, 2, 12, 1, 12, 3, 14, 2, 14, 1, 14, 6, 7, 5, 7, 4, 7, 4, 6, 4, 5, 4, 4, 4, 3, 3, 3, 2, 3, 1, 3])) return light();
                      return dark(x, y);
                  };
                  World.prototype.lizardFootTexture = function (x, y, top) {
                      var angle = (y / 15) * Math.PI * 2;
                      if (Math.floor(Math.sin(angle) * 3 + 6) === x) return light();
                      if (Math.floor(Math.sin(angle) * 3 + 9) === x) return light();
                      return dark(x, y);
                  };
                  function trace(x, y, str) {
                      return str.charAt(x + y * 16) !== ".";
                  }
                  World.prototype.owlHeadTexture = function (x, y, top) {
                      if (trace(x, y, OWL_HEAD)) return light();
                      return dark(x, y);
                  };
                  World.prototype.owlBodyTexture = function (x, y, top) {
                      if (trace(x, y, OWL_BODY)) return light();
                      return dark(x, y);
                  };
                  World.prototype.owlFootTexture = function (x, y, top) {
                      if (trace(x, y, OWL_FOOT)) return light();
                      return dark(x, y);
                  };
                  World.prototype.coyoteHeadTexture = function (x, y, top) {
                      if (trace(x, y, COYOTE_HEAD)) return light();
                      return dark(x, y);
                  };
                  World.prototype.coyoteBodyTexture = function (x, y, top) {
                      if (trace(x, y, COYOTE_BODY)) return light();
                      return dark(x, y);
                  };
                  World.prototype.coyoteFootTexture = function (x, y, top) {
                      if (trace(x, y, COYOTE_FOOT)) return light();
                      return dark(x, y);
                  };
                  World.prototype.headSwitchTexture = function (x, y, top) {
                      return 268435455;
                  };
                  World.prototype.bodySwitchTexture = function (x, y, top) {
                      return 11184810;
                  };
                  World.prototype.footSwitchTexture = function (x, y, top) {
                      return 8947848;
                  };
                  World.prototype.songTexture = function (x, y, top) {
                      if (top) {
                          return this.random() < 0.25 ? 15713828 : 16766516;
                      } else {
                          return this.random() < 0.25 ? 15713828 : 16766516;
                      }
                  };
                  World.prototype.deadSongTexture = function (x, y, top) {
                      if (top) {
                          return 10327097;
                      } else {
                          return 10327097;
                      }
                  };
                  World.prototype.winTexture = function (x, y, top) {
                      if (top) {
                          if ((x + y) % 4 === 0) return this.random() < 0.25 ? 5373875 : 4321187;
                          return this.random() < 0.25 ? 15713828 : 16766516;
                      } else {
                          var angle = (y / 15) * Math.PI * 2;
                          var left = Math.floor(Math.sin(angle) * 3 + 7);
                          var right = Math.ceil(Math.sin(angle) * 3 + 8);
                          if (x >= left && x <= right) return this.random() < 0.25 ? 5373875 : 4321187;
                          return this.random() < 0.25 ? 15713828 : 16766516;
                      }
                  };
                  World.prototype.randomizeGrid = function (density) {
                      for (var i = 1; i < this.grid.length; i++) {
                          if (this.random() < density) this.grid[i] = 1;
                      }
                  };
                  World.prototype.createTree = function (x1, y1, z1) {
                      var height = Math.floor(this.random() * 8) + 7;
                      var y2 = y1 - height;
                      for (var y = y1; y > y2; y--) {
                          var x = x1;
                          var z = z1;
                          var leaves = y1 - y > 3 ? Math.floor(this.random() * 9) + (y1 - y) : 0;
                          while (leaves-- > 0) {
                              if (this.random() < 0.5) {
                                  if (this.random() < 0.5) x--;
                                  else x++;
                              } else {
                                  if (this.random() < 0.5) z--;
                                  else z++;
                              }
                              this.set(x, y, z, 1);
                          }
                          if (y - y2 >= 1) {
                              this.set(x1, y, z1, 5);
                          } else if (this.get(x1, y, z1) === 0) {
                              this.set(x1, y, z1, 1);
                          }
                      }
                  };
                  World.prototype.createShrubs = function (x, y, z) {};
                  World.prototype.createIsland = function (ox, oy, oz, opts) {
                      var size = this.size;
                      var simplex = this.simplex;
                      var radius = opts.radius || 32;
                      var peaks = opts.peaks || 4;
                      var roughness = opts.roughness || 4;
                      var springs = opts.springs || 0;
                      var trees = opts.trees || 0;
                      var half = size * 0.5;
                      for (var x = ox - radius; x <= ox + radius; x++) {
                          for (var z = oz - radius; z <= oz + radius; z++) {
                              var dx = x - ox;
                              var dz = z - oz;
                              var distance = Math.sqrt(dx * dx + dz * dz);
                              var u = (x / size) * roughness;
                              var v = (z / size) * roughness;
                              var height = distance <= radius ? Math.ceil(peaks + simplex.noise3D(u, roughness, v) * (peaks - 1)) : 0;
                              for (var y = oy; y < Math.ceil(oy + (1 - distance / radius) * 3); y++) {
                                  this.set(x, y, z, 2);
                              }
                              for (var y = oy; y > oy - height; y--) {
                                  if (false) {
                                  } else if (y === oy - height + 1) {
                                      this.set(x, y, z, 2);
                                      if (height < peaks * 2 - 2 && this.random() < trees) {
                                          this.createTree(x, y, z);
                                      }
                                  } else {
                                      this.set(x, y, z, 2);
                                  }
                              }
                          }
                      }
                  };
                  World.prototype.createSurface = function (ox, oy, oz, opts) {
                      var size = this.size;
                      var simplex = this.simplex;
                      var radius = opts.radius || 32;
                      var peaks = opts.peaks || 4;
                      var roughness = opts.roughness || 4;
                      var springs = opts.springs || 0;
                      var trees = opts.trees || 0;
                      var half = size * 0.5;
                      for (var x = 0; x < size; x++) {
                          for (var z = 0; z < size; z++) {
                              var dx = x - ox;
                              var dz = z - oz;
                              var distance = Math.sqrt(dx * dx + dz * dz);
                              var u = (x / size) * roughness;
                              var v = (z / size) * roughness;
                              var height = distance <= radius ? Math.ceil(peaks + simplex.noise3D(u, roughness, v) * (peaks - 1)) : 0;
                              for (var y = oy; y > oy - height; y--) {
                                  if (false) {
                                  } else if (y === oy - height + 1) {
                                      this.set(x, y, z, 2);
                                      if (height < peaks * 2 - 2 && this.random() < trees) {
                                          this.createTree(x, y, z);
                                      }
                                  } else {
                                      this.set(x, y, z, 2);
                                  }
                              }
                          }
                      }
                  };
                  World.prototype.createPlatform = function (x1, y, z1, spread) {
                      var size = this.size;
                      for (var x = x1 - spread; x <= x1 + spread; x++) {
                          for (var z = z1 - spread; z <= z1 + spread; z++) {
                              this.set(x, y, z, 2);
                          }
                      }
                  };
                  World.prototype.createBridge = function (x1, y1, z1, x2, y2, z2) {
                      var size = this.size;
                      var dx = x2 - x1;
                      var dy = y2 - y1;
                      var dz = z2 - z1;
                      var endAngle = Math.atan2(dx, dz);
                      var startAngle = endAngle - Math.PI * 0.5;
                      var startDistance = 0;
                      var endDistance = Math.sqrt(dx * dx + dz * dz);
                      for (var i = 0; i < 100; i++) {
                          var percent = i / 100;
                          var angle = startAngle + (endAngle - startAngle) * percent;
                          var distance = startDistance + (endDistance - startDistance) * percent;
                          var x = Math.floor(x1 + Math.cos(angle) * distance);
                          var y = Math.floor(y1 + dy * percent + Math.sin(percent * Math.PI) * dy * 0.5);
                          var z = Math.floor(z1 + Math.sin(angle) * distance);
                          this.grid[x + y * size + z * size * size] = 2;
                      }
                  };
                  module.exports = World;
              },
              { "./maze": 5, seedrandom: 14, "simplex-noise": 15 },
          ],
          12: [
              function (require, module, exports) {
                  !(function (undefined) {
                      var isArray = Array.isArray
                          ? Array.isArray
                          : function _isArray(obj) {
                                return Object.prototype.toString.call(obj) === "[object Array]";
                            };
                      var defaultMaxListeners = 10;
                      function init() {
                          this._events = {};
                          if (this._conf) {
                              configure.call(this, this._conf);
                          }
                      }
                      function configure(conf) {
                          if (conf) {
                              this._conf = conf;
                              conf.delimiter && (this.delimiter = conf.delimiter);
                              conf.maxListeners && (this._events.maxListeners = conf.maxListeners);
                              conf.wildcard && (this.wildcard = conf.wildcard);
                              conf.newListener && (this.newListener = conf.newListener);
                              if (this.wildcard) {
                                  this.listenerTree = {};
                              }
                          }
                      }
                      function EventEmitter(conf) {
                          this._events = {};
                          this.newListener = false;
                          configure.call(this, conf);
                      }
                      function searchListenerTree(handlers, type, tree, i) {
                          if (!tree) {
                              return [];
                          }
                          var listeners = [],
                              leaf,
                              len,
                              branch,
                              xTree,
                              xxTree,
                              isolatedBranch,
                              endReached,
                              typeLength = type.length,
                              currentType = type[i],
                              nextType = type[i + 1];
                          if (i === typeLength && tree._listeners) {
                              if (typeof tree._listeners === "function") {
                                  handlers && handlers.push(tree._listeners);
                                  return [tree];
                              } else {
                                  for (leaf = 0, len = tree._listeners.length; leaf < len; leaf++) {
                                      handlers && handlers.push(tree._listeners[leaf]);
                                  }
                                  return [tree];
                              }
                          }
                          if (currentType === "*" || currentType === "**" || tree[currentType]) {
                              if (currentType === "*") {
                                  for (branch in tree) {
                                      if (branch !== "_listeners" && tree.hasOwnProperty(branch)) {
                                          listeners = listeners.concat(searchListenerTree(handlers, type, tree[branch], i + 1));
                                      }
                                  }
                                  return listeners;
                              } else if (currentType === "**") {
                                  endReached = i + 1 === typeLength || (i + 2 === typeLength && nextType === "*");
                                  if (endReached && tree._listeners) {
                                      listeners = listeners.concat(searchListenerTree(handlers, type, tree, typeLength));
                                  }
                                  for (branch in tree) {
                                      if (branch !== "_listeners" && tree.hasOwnProperty(branch)) {
                                          if (branch === "*" || branch === "**") {
                                              if (tree[branch]._listeners && !endReached) {
                                                  listeners = listeners.concat(searchListenerTree(handlers, type, tree[branch], typeLength));
                                              }
                                              listeners = listeners.concat(searchListenerTree(handlers, type, tree[branch], i));
                                          } else if (branch === nextType) {
                                              listeners = listeners.concat(searchListenerTree(handlers, type, tree[branch], i + 2));
                                          } else {
                                              listeners = listeners.concat(searchListenerTree(handlers, type, tree[branch], i));
                                          }
                                      }
                                  }
                                  return listeners;
                              }
                              listeners = listeners.concat(searchListenerTree(handlers, type, tree[currentType], i + 1));
                          }
                          xTree = tree["*"];
                          if (xTree) {
                              searchListenerTree(handlers, type, xTree, i + 1);
                          }
                          xxTree = tree["**"];
                          if (xxTree) {
                              if (i < typeLength) {
                                  if (xxTree._listeners) {
                                      searchListenerTree(handlers, type, xxTree, typeLength);
                                  }
                                  for (branch in xxTree) {
                                      if (branch !== "_listeners" && xxTree.hasOwnProperty(branch)) {
                                          if (branch === nextType) {
                                              searchListenerTree(handlers, type, xxTree[branch], i + 2);
                                          } else if (branch === currentType) {
                                              searchListenerTree(handlers, type, xxTree[branch], i + 1);
                                          } else {
                                              isolatedBranch = {};
                                              isolatedBranch[branch] = xxTree[branch];
                                              searchListenerTree(handlers, type, { "**": isolatedBranch }, i + 1);
                                          }
                                      }
                                  }
                              } else if (xxTree._listeners) {
                                  searchListenerTree(handlers, type, xxTree, typeLength);
                              } else if (xxTree["*"] && xxTree["*"]._listeners) {
                                  searchListenerTree(handlers, type, xxTree["*"], typeLength);
                              }
                          }
                          return listeners;
                      }
                      function growListenerTree(type, listener) {
                          type = typeof type === "string" ? type.split(this.delimiter) : type.slice();
                          for (var i = 0, len = type.length; i + 1 < len; i++) {
                              if (type[i] === "**" && type[i + 1] === "**") {
                                  return;
                              }
                          }
                          var tree = this.listenerTree;
                          var name = type.shift();
                          while (name) {
                              if (!tree[name]) {
                                  tree[name] = {};
                              }
                              tree = tree[name];
                              if (type.length === 0) {
                                  if (!tree._listeners) {
                                      tree._listeners = listener;
                                  } else if (typeof tree._listeners === "function") {
                                      tree._listeners = [tree._listeners, listener];
                                  } else if (isArray(tree._listeners)) {
                                      tree._listeners.push(listener);
                                      if (!tree._listeners.warned) {
                                          var m = defaultMaxListeners;
                                          if (typeof this._events.maxListeners !== "undefined") {
                                              m = this._events.maxListeners;
                                          }
                                          if (m > 0 && tree._listeners.length > m) {
                                              tree._listeners.warned = true;
                                              console.error("(node) warning: possible EventEmitter memory " + "leak detected. %d listeners added. " + "Use emitter.setMaxListeners() to increase limit.", tree._listeners.length);
                                              console.trace();
                                          }
                                      }
                                  }
                                  return true;
                              }
                              name = type.shift();
                          }
                          return true;
                      }
                      EventEmitter.prototype.delimiter = ".";
                      EventEmitter.prototype.setMaxListeners = function (n) {
                          this._events || init.call(this);
                          this._events.maxListeners = n;
                          if (!this._conf) this._conf = {};
                          this._conf.maxListeners = n;
                      };
                      EventEmitter.prototype.event = "";
                      EventEmitter.prototype.once = function (event, fn) {
                          this.many(event, 1, fn);
                          return this;
                      };
                      EventEmitter.prototype.many = function (event, ttl, fn) {
                          var self = this;
                          if (typeof fn !== "function") {
                              throw new Error("many only accepts instances of Function");
                          }
                          function listener() {
                              if (--ttl === 0) {
                                  self.off(event, listener);
                              }
                              fn.apply(this, arguments);
                          }
                          listener._origin = fn;
                          this.on(event, listener);
                          return self;
                      };
                      EventEmitter.prototype.emit = function () {
                          this._events || init.call(this);
                          var type = arguments[0];
                          if (type === "newListener" && !this.newListener) {
                              if (!this._events.newListener) {
                                  return false;
                              }
                          }
                          if (this._all) {
                              var l = arguments.length;
                              var args = new Array(l - 1);
                              for (var i = 1; i < l; i++) args[i - 1] = arguments[i];
                              for (i = 0, l = this._all.length; i < l; i++) {
                                  this.event = type;
                                  this._all[i].apply(this, args);
                              }
                          }
                          if (type === "error") {
                              if (!this._all && !this._events.error && !(this.wildcard && this.listenerTree.error)) {
                                  if (arguments[1] instanceof Error) {
                                      throw arguments[1];
                                  } else {
                                      throw new Error("Uncaught, unspecified 'error' event.");
                                  }
                              }
                          }
                          var handler;
                          if (this.wildcard) {
                              handler = [];
                              var ns = typeof type === "string" ? type.split(this.delimiter) : type.slice();
                              searchListenerTree.call(this, handler, ns, this.listenerTree, 0);
                          } else {
                              handler = this._events[type];
                          }
                          if (typeof handler === "function") {
                              this.event = type;
                              if (arguments.length === 1) {
                                  handler.call(this);
                              } else if (arguments.length > 1)
                                  switch (arguments.length) {
                                      case 2:
                                          handler.call(this, arguments[1]);
                                          break;
                                      case 3:
                                          handler.call(this, arguments[1], arguments[2]);
                                          break;
                                      default:
                                          var l = arguments.length;
                                          var args = new Array(l - 1);
                                          for (var i = 1; i < l; i++) args[i - 1] = arguments[i];
                                          handler.apply(this, args);
                                  }
                              return true;
                          } else if (handler) {
                              var l = arguments.length;
                              var args = new Array(l - 1);
                              for (var i = 1; i < l; i++) args[i - 1] = arguments[i];
                              var listeners = handler.slice();
                              for (var i = 0, l = listeners.length; i < l; i++) {
                                  this.event = type;
                                  listeners[i].apply(this, args);
                              }
                              return listeners.length > 0 || !!this._all;
                          } else {
                              return !!this._all;
                          }
                      };
                      EventEmitter.prototype.on = function (type, listener) {
                          if (typeof type === "function") {
                              this.onAny(type);
                              return this;
                          }
                          if (typeof listener !== "function") {
                              throw new Error("on only accepts instances of Function");
                          }
                          this._events || init.call(this);
                          this.emit("newListener", type, listener);
                          if (this.wildcard) {
                              growListenerTree.call(this, type, listener);
                              return this;
                          }
                          if (!this._events[type]) {
                              this._events[type] = listener;
                          } else if (typeof this._events[type] === "function") {
                              this._events[type] = [this._events[type], listener];
                          } else if (isArray(this._events[type])) {
                              this._events[type].push(listener);
                              if (!this._events[type].warned) {
                                  var m = defaultMaxListeners;
                                  if (typeof this._events.maxListeners !== "undefined") {
                                      m = this._events.maxListeners;
                                  }
                                  if (m > 0 && this._events[type].length > m) {
                                      this._events[type].warned = true;
                                      console.error("(node) warning: possible EventEmitter memory " + "leak detected. %d listeners added. " + "Use emitter.setMaxListeners() to increase limit.", this._events[type].length);
                                      console.trace();
                                  }
                              }
                          }
                          return this;
                      };
                      EventEmitter.prototype.onAny = function (fn) {
                          if (typeof fn !== "function") {
                              throw new Error("onAny only accepts instances of Function");
                          }
                          if (!this._all) {
                              this._all = [];
                          }
                          this._all.push(fn);
                          return this;
                      };
                      EventEmitter.prototype.addListener = EventEmitter.prototype.on;
                      EventEmitter.prototype.off = function (type, listener) {
                          if (typeof listener !== "function") {
                              throw new Error("removeListener only takes instances of Function");
                          }
                          var handlers,
                              leafs = [];
                          if (this.wildcard) {
                              var ns = typeof type === "string" ? type.split(this.delimiter) : type.slice();
                              leafs = searchListenerTree.call(this, null, ns, this.listenerTree, 0);
                          } else {
                              if (!this._events[type]) return this;
                              handlers = this._events[type];
                              leafs.push({ _listeners: handlers });
                          }
                          for (var iLeaf = 0; iLeaf < leafs.length; iLeaf++) {
                              var leaf = leafs[iLeaf];
                              handlers = leaf._listeners;
                              if (isArray(handlers)) {
                                  var position = -1;
                                  for (var i = 0, length = handlers.length; i < length; i++) {
                                      if (handlers[i] === listener || (handlers[i].listener && handlers[i].listener === listener) || (handlers[i]._origin && handlers[i]._origin === listener)) {
                                          position = i;
                                          break;
                                      }
                                  }
                                  if (position < 0) {
                                      continue;
                                  }
                                  if (this.wildcard) {
                                      leaf._listeners.splice(position, 1);
                                  } else {
                                      this._events[type].splice(position, 1);
                                  }
                                  if (handlers.length === 0) {
                                      if (this.wildcard) {
                                          delete leaf._listeners;
                                      } else {
                                          delete this._events[type];
                                      }
                                  }
                                  return this;
                              } else if (handlers === listener || (handlers.listener && handlers.listener === listener) || (handlers._origin && handlers._origin === listener)) {
                                  if (this.wildcard) {
                                      delete leaf._listeners;
                                  } else {
                                      delete this._events[type];
                                  }
                              }
                          }
                          return this;
                      };
                      EventEmitter.prototype.offAny = function (fn) {
                          var i = 0,
                              l = 0,
                              fns;
                          if (fn && this._all && this._all.length > 0) {
                              fns = this._all;
                              for (i = 0, l = fns.length; i < l; i++) {
                                  if (fn === fns[i]) {
                                      fns.splice(i, 1);
                                      return this;
                                  }
                              }
                          } else {
                              this._all = [];
                          }
                          return this;
                      };
                      EventEmitter.prototype.removeListener = EventEmitter.prototype.off;
                      EventEmitter.prototype.removeAllListeners = function (type) {
                          if (arguments.length === 0) {
                              !this._events || init.call(this);
                              return this;
                          }
                          if (this.wildcard) {
                              var ns = typeof type === "string" ? type.split(this.delimiter) : type.slice();
                              var leafs = searchListenerTree.call(this, null, ns, this.listenerTree, 0);
                              for (var iLeaf = 0; iLeaf < leafs.length; iLeaf++) {
                                  var leaf = leafs[iLeaf];
                                  leaf._listeners = null;
                              }
                          } else {
                              if (!this._events[type]) return this;
                              this._events[type] = null;
                          }
                          return this;
                      };
                      EventEmitter.prototype.listeners = function (type) {
                          if (this.wildcard) {
                              var handlers = [];
                              var ns = typeof type === "string" ? type.split(this.delimiter) : type.slice();
                              searchListenerTree.call(this, handlers, ns, this.listenerTree, 0);
                              return handlers;
                          }
                          this._events || init.call(this);
                          if (!this._events[type]) this._events[type] = [];
                          if (!isArray(this._events[type])) {
                              this._events[type] = [this._events[type]];
                          }
                          return this._events[type];
                      };
                      EventEmitter.prototype.listenersAny = function () {
                          if (this._all) {
                              return this._all;
                          } else {
                              return [];
                          }
                      };
                      if (typeof define === "function" && define.amd) {
                          define(function () {
                              return EventEmitter;
                          });
                      } else if (typeof exports === "object") {
                          exports.EventEmitter2 = EventEmitter;
                      } else {
                          window.EventEmitter2 = EventEmitter;
                      }
                  })();
              },
              {},
          ],
          13: [
              function (require, module, exports) {
                  (function (global) {
                      (function () {
                          var undefined;
                          var arrayPool = [],
                              objectPool = [];
                          var idCounter = 0;
                          var keyPrefix = +new Date() + "";
                          var largeArraySize = 75;
                          var maxPoolSize = 40;
                          var whitespace = " 	\f ﻿" + "\n\r\u2028\u2029" + " ᠎             　";
                          var reEmptyStringLeading = /\b__p \+= '';/g,
                              reEmptyStringMiddle = /\b(__p \+=) '' \+/g,
                              reEmptyStringTrailing = /(__e\(.*?\)|\b__t\)) \+\n'';/g;
                          var reEsTemplate = /\$\{([^\\}]*(?:\\.[^\\}]*)*)\}/g;
                          var reFlags = /\w*$/;
                          var reFuncName = /^\s*function[ \n\r\t]+\w/;
                          var reInterpolate = /<%=([\s\S]+?)%>/g;
                          var reLeadingSpacesAndZeros = RegExp("^[" + whitespace + "]*0+(?=.$)");
                          var reNoMatch = /($^)/;
                          var reThis = /\bthis\b/;
                          var reUnescapedString = /['\n\r\t\u2028\u2029\\]/g;
                          var contextProps = ["Array", "Boolean", "Date", "Function", "Math", "Number", "Object", "RegExp", "String", "_", "attachEvent", "clearTimeout", "isFinite", "isNaN", "parseInt", "setTimeout"];
                          var templateCounter = 0;
                          var argsClass = "[object Arguments]",
                              arrayClass = "[object Array]",
                              boolClass = "[object Boolean]",
                              dateClass = "[object Date]",
                              funcClass = "[object Function]",
                              numberClass = "[object Number]",
                              objectClass = "[object Object]",
                              regexpClass = "[object RegExp]",
                              stringClass = "[object String]";
                          var cloneableClasses = {};
                          cloneableClasses[funcClass] = false;
                          cloneableClasses[argsClass] = cloneableClasses[arrayClass] = cloneableClasses[boolClass] = cloneableClasses[dateClass] = cloneableClasses[numberClass] = cloneableClasses[objectClass] = cloneableClasses[
                              regexpClass
                          ] = cloneableClasses[stringClass] = true;
                          var debounceOptions = { leading: false, maxWait: 0, trailing: false };
                          var descriptor = { configurable: false, enumerable: false, value: null, writable: false };
                          var objectTypes = { boolean: false, function: true, object: true, number: false, string: false, undefined: false };
                          var stringEscapes = { "\\": "\\", "'": "'", "\n": "n", "\r": "r", "	": "t", "\u2028": "u2028", "\u2029": "u2029" };
                          var root = (objectTypes[typeof window] && window) || this;
                          var freeExports = objectTypes[typeof exports] && exports && !exports.nodeType && exports;
                          var freeModule = objectTypes[typeof module] && module && !module.nodeType && module;
                          var moduleExports = freeModule && freeModule.exports === freeExports && freeExports;
                          var freeGlobal = objectTypes[typeof global] && global;
                          if (freeGlobal && (freeGlobal.global === freeGlobal || freeGlobal.window === freeGlobal)) {
                              root = freeGlobal;
                          }
                          function baseIndexOf(array, value, fromIndex) {
                              var index = (fromIndex || 0) - 1,
                                  length = array ? array.length : 0;
                              while (++index < length) {
                                  if (array[index] === value) {
                                      return index;
                                  }
                              }
                              return -1;
                          }
                          function cacheIndexOf(cache, value) {
                              var type = typeof value;
                              cache = cache.cache;
                              if (type == "boolean" || value == null) {
                                  return cache[value] ? 0 : -1;
                              }
                              if (type != "number" && type != "string") {
                                  type = "object";
                              }
                              var key = type == "number" ? value : keyPrefix + value;
                              cache = (cache = cache[type]) && cache[key];
                              return type == "object" ? (cache && baseIndexOf(cache, value) > -1 ? 0 : -1) : cache ? 0 : -1;
                          }
                          function cachePush(value) {
                              var cache = this.cache,
                                  type = typeof value;
                              if (type == "boolean" || value == null) {
                                  cache[value] = true;
                              } else {
                                  if (type != "number" && type != "string") {
                                      type = "object";
                                  }
                                  var key = type == "number" ? value : keyPrefix + value,
                                      typeCache = cache[type] || (cache[type] = {});
                                  if (type == "object") {
                                      (typeCache[key] || (typeCache[key] = [])).push(value);
                                  } else {
                                      typeCache[key] = true;
                                  }
                              }
                          }
                          function charAtCallback(value) {
                              return value.charCodeAt(0);
                          }
                          function compareAscending(a, b) {
                              var ac = a.criteria,
                                  bc = b.criteria,
                                  index = -1,
                                  length = ac.length;
                              while (++index < length) {
                                  var value = ac[index],
                                      other = bc[index];
                                  if (value !== other) {
                                      if (value > other || typeof value == "undefined") {
                                          return 1;
                                      }
                                      if (value < other || typeof other == "undefined") {
                                          return -1;
                                      }
                                  }
                              }
                              return a.index - b.index;
                          }
                          function createCache(array) {
                              var index = -1,
                                  length = array.length,
                                  first = array[0],
                                  mid = array[(length / 2) | 0],
                                  last = array[length - 1];
                              if (first && typeof first == "object" && mid && typeof mid == "object" && last && typeof last == "object") {
                                  return false;
                              }
                              var cache = getObject();
                              cache["false"] = cache["null"] = cache["true"] = cache["undefined"] = false;
                              var result = getObject();
                              result.array = array;
                              result.cache = cache;
                              result.push = cachePush;
                              while (++index < length) {
                                  result.push(array[index]);
                              }
                              return result;
                          }
                          function escapeStringChar(match) {
                              return "\\" + stringEscapes[match];
                          }
                          function getArray() {
                              return arrayPool.pop() || [];
                          }
                          function getObject() {
                              return objectPool.pop() || { array: null, cache: null, criteria: null, false: false, index: 0, null: false, number: null, object: null, push: null, string: null, true: false, undefined: false, value: null };
                          }
                          function releaseArray(array) {
                              array.length = 0;
                              if (arrayPool.length < maxPoolSize) {
                                  arrayPool.push(array);
                              }
                          }
                          function releaseObject(object) {
                              var cache = object.cache;
                              if (cache) {
                                  releaseObject(cache);
                              }
                              object.array = object.cache = object.criteria = object.object = object.number = object.string = object.value = null;
                              if (objectPool.length < maxPoolSize) {
                                  objectPool.push(object);
                              }
                          }
                          function slice(array, start, end) {
                              start || (start = 0);
                              if (typeof end == "undefined") {
                                  end = array ? array.length : 0;
                              }
                              var index = -1,
                                  length = end - start || 0,
                                  result = Array(length < 0 ? 0 : length);
                              while (++index < length) {
                                  result[index] = array[start + index];
                              }
                              return result;
                          }
                          function runInContext(context) {
                              context = context ? _.defaults(root.Object(), context, _.pick(root, contextProps)) : root;
                              var Array = context.Array,
                                  Boolean = context.Boolean,
                                  Date = context.Date,
                                  Function = context.Function,
                                  Math = context.Math,
                                  Number = context.Number,
                                  Object = context.Object,
                                  RegExp = context.RegExp,
                                  String = context.String,
                                  TypeError = context.TypeError;
                              var arrayRef = [];
                              var objectProto = Object.prototype;
                              var oldDash = context._;
                              var toString = objectProto.toString;
                              var reNative = RegExp(
                                  "^" +
                                      String(toString)
                                          .replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
                                          .replace(/toString| for [^\]]+/g, ".*?") +
                                      "$"
                              );
                              var ceil = Math.ceil,
                                  clearTimeout = context.clearTimeout,
                                  floor = Math.floor,
                                  fnToString = Function.prototype.toString,
                                  getPrototypeOf = isNative((getPrototypeOf = Object.getPrototypeOf)) && getPrototypeOf,
                                  hasOwnProperty = objectProto.hasOwnProperty,
                                  push = arrayRef.push,
                                  setTimeout = context.setTimeout,
                                  splice = arrayRef.splice,
                                  unshift = arrayRef.unshift;
                              var defineProperty = (function () {
                                  try {
                                      var o = {},
                                          func = isNative((func = Object.defineProperty)) && func,
                                          result = func(o, o, o) && func;
                                  } catch (e) {}
                                  return result;
                              })();
                              var nativeCreate = isNative((nativeCreate = Object.create)) && nativeCreate,
                                  nativeIsArray = isNative((nativeIsArray = Array.isArray)) && nativeIsArray,
                                  nativeIsFinite = context.isFinite,
                                  nativeIsNaN = context.isNaN,
                                  nativeKeys = isNative((nativeKeys = Object.keys)) && nativeKeys,
                                  nativeMax = Math.max,
                                  nativeMin = Math.min,
                                  nativeParseInt = context.parseInt,
                                  nativeRandom = Math.random;
                              var ctorByClass = {};
                              ctorByClass[arrayClass] = Array;
                              ctorByClass[boolClass] = Boolean;
                              ctorByClass[dateClass] = Date;
                              ctorByClass[funcClass] = Function;
                              ctorByClass[objectClass] = Object;
                              ctorByClass[numberClass] = Number;
                              ctorByClass[regexpClass] = RegExp;
                              ctorByClass[stringClass] = String;
                              function lodash(value) {
                                  return value && typeof value == "object" && !isArray(value) && hasOwnProperty.call(value, "__wrapped__") ? value : new lodashWrapper(value);
                              }
                              function lodashWrapper(value, chainAll) {
                                  this.__chain__ = !!chainAll;
                                  this.__wrapped__ = value;
                              }
                              lodashWrapper.prototype = lodash.prototype;
                              var support = (lodash.support = {});
                              support.funcDecomp = !isNative(context.WinRTError) && reThis.test(runInContext);
                              support.funcNames = typeof Function.name == "string";
                              lodash.templateSettings = { escape: /<%-([\s\S]+?)%>/g, evaluate: /<%([\s\S]+?)%>/g, interpolate: reInterpolate, variable: "", imports: { _: lodash } };
                              function baseBind(bindData) {
                                  var func = bindData[0],
                                      partialArgs = bindData[2],
                                      thisArg = bindData[4];
                                  function bound() {
                                      if (partialArgs) {
                                          var args = slice(partialArgs);
                                          push.apply(args, arguments);
                                      }
                                      if (this instanceof bound) {
                                          var thisBinding = baseCreate(func.prototype),
                                              result = func.apply(thisBinding, args || arguments);
                                          return isObject(result) ? result : thisBinding;
                                      }
                                      return func.apply(thisArg, args || arguments);
                                  }
                                  setBindData(bound, bindData);
                                  return bound;
                              }
                              function baseClone(value, isDeep, callback, stackA, stackB) {
                                  if (callback) {
                                      var result = callback(value);
                                      if (typeof result != "undefined") {
                                          return result;
                                      }
                                  }
                                  var isObj = isObject(value);
                                  if (isObj) {
                                      var className = toString.call(value);
                                      if (!cloneableClasses[className]) {
                                          return value;
                                      }
                                      var ctor = ctorByClass[className];
                                      switch (className) {
                                          case boolClass:
                                          case dateClass:
                                              return new ctor(+value);
                                          case numberClass:
                                          case stringClass:
                                              return new ctor(value);
                                          case regexpClass:
                                              result = ctor(value.source, reFlags.exec(value));
                                              result.lastIndex = value.lastIndex;
                                              return result;
                                      }
                                  } else {
                                      return value;
                                  }
                                  var isArr = isArray(value);
                                  if (isDeep) {
                                      var initedStack = !stackA;
                                      stackA || (stackA = getArray());
                                      stackB || (stackB = getArray());
                                      var length = stackA.length;
                                      while (length--) {
                                          if (stackA[length] == value) {
                                              return stackB[length];
                                          }
                                      }
                                      result = isArr ? ctor(value.length) : {};
                                  } else {
                                      result = isArr ? slice(value) : assign({}, value);
                                  }
                                  if (isArr) {
                                      if (hasOwnProperty.call(value, "index")) {
                                          result.index = value.index;
                                      }
                                      if (hasOwnProperty.call(value, "input")) {
                                          result.input = value.input;
                                      }
                                  }
                                  if (!isDeep) {
                                      return result;
                                  }
                                  stackA.push(value);
                                  stackB.push(result);
                                  (isArr ? forEach : forOwn)(value, function (objValue, key) {
                                      result[key] = baseClone(objValue, isDeep, callback, stackA, stackB);
                                  });
                                  if (initedStack) {
                                      releaseArray(stackA);
                                      releaseArray(stackB);
                                  }
                                  return result;
                              }
                              function baseCreate(prototype, properties) {
                                  return isObject(prototype) ? nativeCreate(prototype) : {};
                              }
                              if (!nativeCreate) {
                                  baseCreate = (function () {
                                      function Object() {}
                                      return function (prototype) {
                                          if (isObject(prototype)) {
                                              Object.prototype = prototype;
                                              var result = new Object();
                                              Object.prototype = null;
                                          }
                                          return result || context.Object();
                                      };
                                  })();
                              }
                              function baseCreateCallback(func, thisArg, argCount) {
                                  if (typeof func != "function") {
                                      return identity;
                                  }
                                  if (typeof thisArg == "undefined" || !("prototype" in func)) {
                                      return func;
                                  }
                                  var bindData = func.__bindData__;
                                  if (typeof bindData == "undefined") {
                                      if (support.funcNames) {
                                          bindData = !func.name;
                                      }
                                      bindData = bindData || !support.funcDecomp;
                                      if (!bindData) {
                                          var source = fnToString.call(func);
                                          if (!support.funcNames) {
                                              bindData = !reFuncName.test(source);
                                          }
                                          if (!bindData) {
                                              bindData = reThis.test(source);
                                              setBindData(func, bindData);
                                          }
                                      }
                                  }
                                  if (bindData === false || (bindData !== true && bindData[1] & 1)) {
                                      return func;
                                  }
                                  switch (argCount) {
                                      case 1:
                                          return function (value) {
                                              return func.call(thisArg, value);
                                          };
                                      case 2:
                                          return function (a, b) {
                                              return func.call(thisArg, a, b);
                                          };
                                      case 3:
                                          return function (value, index, collection) {
                                              return func.call(thisArg, value, index, collection);
                                          };
                                      case 4:
                                          return function (accumulator, value, index, collection) {
                                              return func.call(thisArg, accumulator, value, index, collection);
                                          };
                                  }
                                  return bind(func, thisArg);
                              }
                              function baseCreateWrapper(bindData) {
                                  var func = bindData[0],
                                      bitmask = bindData[1],
                                      partialArgs = bindData[2],
                                      partialRightArgs = bindData[3],
                                      thisArg = bindData[4],
                                      arity = bindData[5];
                                  var isBind = bitmask & 1,
                                      isBindKey = bitmask & 2,
                                      isCurry = bitmask & 4,
                                      isCurryBound = bitmask & 8,
                                      key = func;
                                  function bound() {
                                      var thisBinding = isBind ? thisArg : this;
                                      if (partialArgs) {
                                          var args = slice(partialArgs);
                                          push.apply(args, arguments);
                                      }
                                      if (partialRightArgs || isCurry) {
                                          args || (args = slice(arguments));
                                          if (partialRightArgs) {
                                              push.apply(args, partialRightArgs);
                                          }
                                          if (isCurry && args.length < arity) {
                                              bitmask |= 16 & ~32;
                                              return baseCreateWrapper([func, isCurryBound ? bitmask : bitmask & ~3, args, null, thisArg, arity]);
                                          }
                                      }
                                      args || (args = arguments);
                                      if (isBindKey) {
                                          func = thisBinding[key];
                                      }
                                      if (this instanceof bound) {
                                          thisBinding = baseCreate(func.prototype);
                                          var result = func.apply(thisBinding, args);
                                          return isObject(result) ? result : thisBinding;
                                      }
                                      return func.apply(thisBinding, args);
                                  }
                                  setBindData(bound, bindData);
                                  return bound;
                              }
                              function baseDifference(array, values) {
                                  var index = -1,
                                      indexOf = getIndexOf(),
                                      length = array ? array.length : 0,
                                      isLarge = length >= largeArraySize && indexOf === baseIndexOf,
                                      result = [];
                                  if (isLarge) {
                                      var cache = createCache(values);
                                      if (cache) {
                                          indexOf = cacheIndexOf;
                                          values = cache;
                                      } else {
                                          isLarge = false;
                                      }
                                  }
                                  while (++index < length) {
                                      var value = array[index];
                                      if (indexOf(values, value) < 0) {
                                          result.push(value);
                                      }
                                  }
                                  if (isLarge) {
                                      releaseObject(values);
                                  }
                                  return result;
                              }
                              function baseFlatten(array, isShallow, isStrict, fromIndex) {
                                  var index = (fromIndex || 0) - 1,
                                      length = array ? array.length : 0,
                                      result = [];
                                  while (++index < length) {
                                      var value = array[index];
                                      if (value && typeof value == "object" && typeof value.length == "number" && (isArray(value) || isArguments(value))) {
                                          if (!isShallow) {
                                              value = baseFlatten(value, isShallow, isStrict);
                                          }
                                          var valIndex = -1,
                                              valLength = value.length,
                                              resIndex = result.length;
                                          result.length += valLength;
                                          while (++valIndex < valLength) {
                                              result[resIndex++] = value[valIndex];
                                          }
                                      } else if (!isStrict) {
                                          result.push(value);
                                      }
                                  }
                                  return result;
                              }
                              function baseIsEqual(a, b, callback, isWhere, stackA, stackB) {
                                  if (callback) {
                                      var result = callback(a, b);
                                      if (typeof result != "undefined") {
                                          return !!result;
                                      }
                                  }
                                  if (a === b) {
                                      return a !== 0 || 1 / a == 1 / b;
                                  }
                                  var type = typeof a,
                                      otherType = typeof b;
                                  if (a === a && !(a && objectTypes[type]) && !(b && objectTypes[otherType])) {
                                      return false;
                                  }
                                  if (a == null || b == null) {
                                      return a === b;
                                  }
                                  var className = toString.call(a),
                                      otherClass = toString.call(b);
                                  if (className == argsClass) {
                                      className = objectClass;
                                  }
                                  if (otherClass == argsClass) {
                                      otherClass = objectClass;
                                  }
                                  if (className != otherClass) {
                                      return false;
                                  }
                                  switch (className) {
                                      case boolClass:
                                      case dateClass:
                                          return +a == +b;
                                      case numberClass:
                                          return a != +a ? b != +b : a == 0 ? 1 / a == 1 / b : a == +b;
                                      case regexpClass:
                                      case stringClass:
                                          return a == String(b);
                                  }
                                  var isArr = className == arrayClass;
                                  if (!isArr) {
                                      var aWrapped = hasOwnProperty.call(a, "__wrapped__"),
                                          bWrapped = hasOwnProperty.call(b, "__wrapped__");
                                      if (aWrapped || bWrapped) {
                                          return baseIsEqual(aWrapped ? a.__wrapped__ : a, bWrapped ? b.__wrapped__ : b, callback, isWhere, stackA, stackB);
                                      }
                                      if (className != objectClass) {
                                          return false;
                                      }
                                      var ctorA = a.constructor,
                                          ctorB = b.constructor;
                                      if (ctorA != ctorB && !(isFunction(ctorA) && ctorA instanceof ctorA && isFunction(ctorB) && ctorB instanceof ctorB) && "constructor" in a && "constructor" in b) {
                                          return false;
                                      }
                                  }
                                  var initedStack = !stackA;
                                  stackA || (stackA = getArray());
                                  stackB || (stackB = getArray());
                                  var length = stackA.length;
                                  while (length--) {
                                      if (stackA[length] == a) {
                                          return stackB[length] == b;
                                      }
                                  }
                                  var size = 0;
                                  result = true;
                                  stackA.push(a);
                                  stackB.push(b);
                                  if (isArr) {
                                      length = a.length;
                                      size = b.length;
                                      result = size == length;
                                      if (result || isWhere) {
                                          while (size--) {
                                              var index = length,
                                                  value = b[size];
                                              if (isWhere) {
                                                  while (index--) {
                                                      if ((result = baseIsEqual(a[index], value, callback, isWhere, stackA, stackB))) {
                                                          break;
                                                      }
                                                  }
                                              } else if (!(result = baseIsEqual(a[size], value, callback, isWhere, stackA, stackB))) {
                                                  break;
                                              }
                                          }
                                      }
                                  } else {
                                      forIn(b, function (value, key, b) {
                                          if (hasOwnProperty.call(b, key)) {
                                              size++;
                                              return (result = hasOwnProperty.call(a, key) && baseIsEqual(a[key], value, callback, isWhere, stackA, stackB));
                                          }
                                      });
                                      if (result && !isWhere) {
                                          forIn(a, function (value, key, a) {
                                              if (hasOwnProperty.call(a, key)) {
                                                  return (result = --size > -1);
                                              }
                                          });
                                      }
                                  }
                                  stackA.pop();
                                  stackB.pop();
                                  if (initedStack) {
                                      releaseArray(stackA);
                                      releaseArray(stackB);
                                  }
                                  return result;
                              }
                              function baseMerge(object, source, callback, stackA, stackB) {
                                  (isArray(source) ? forEach : forOwn)(source, function (source, key) {
                                      var found,
                                          isArr,
                                          result = source,
                                          value = object[key];
                                      if (source && ((isArr = isArray(source)) || isPlainObject(source))) {
                                          var stackLength = stackA.length;
                                          while (stackLength--) {
                                              if ((found = stackA[stackLength] == source)) {
                                                  value = stackB[stackLength];
                                                  break;
                                              }
                                          }
                                          if (!found) {
                                              var isShallow;
                                              if (callback) {
                                                  result = callback(value, source);
                                                  if ((isShallow = typeof result != "undefined")) {
                                                      value = result;
                                                  }
                                              }
                                              if (!isShallow) {
                                                  value = isArr ? (isArray(value) ? value : []) : isPlainObject(value) ? value : {};
                                              }
                                              stackA.push(source);
                                              stackB.push(value);
                                              if (!isShallow) {
                                                  baseMerge(value, source, callback, stackA, stackB);
                                              }
                                          }
                                      } else {
                                          if (callback) {
                                              result = callback(value, source);
                                              if (typeof result == "undefined") {
                                                  result = source;
                                              }
                                          }
                                          if (typeof result != "undefined") {
                                              value = result;
                                          }
                                      }
                                      object[key] = value;
                                  });
                              }
                              function baseRandom(min, max) {
                                  return min + floor(nativeRandom() * (max - min + 1));
                              }
                              function baseUniq(array, isSorted, callback) {
                                  var index = -1,
                                      indexOf = getIndexOf(),
                                      length = array ? array.length : 0,
                                      result = [];
                                  var isLarge = !isSorted && length >= largeArraySize && indexOf === baseIndexOf,
                                      seen = callback || isLarge ? getArray() : result;
                                  if (isLarge) {
                                      var cache = createCache(seen);
                                      indexOf = cacheIndexOf;
                                      seen = cache;
                                  }
                                  while (++index < length) {
                                      var value = array[index],
                                          computed = callback ? callback(value, index, array) : value;
                                      if (isSorted ? !index || seen[seen.length - 1] !== computed : indexOf(seen, computed) < 0) {
                                          if (callback || isLarge) {
                                              seen.push(computed);
                                          }
                                          result.push(value);
                                      }
                                  }
                                  if (isLarge) {
                                      releaseArray(seen.array);
                                      releaseObject(seen);
                                  } else if (callback) {
                                      releaseArray(seen);
                                  }
                                  return result;
                              }
                              function createAggregator(setter) {
                                  return function (collection, callback, thisArg) {
                                      var result = {};
                                      callback = lodash.createCallback(callback, thisArg, 3);
                                      var index = -1,
                                          length = collection ? collection.length : 0;
                                      if (typeof length == "number") {
                                          while (++index < length) {
                                              var value = collection[index];
                                              setter(result, value, callback(value, index, collection), collection);
                                          }
                                      } else {
                                          forOwn(collection, function (value, key, collection) {
                                              setter(result, value, callback(value, key, collection), collection);
                                          });
                                      }
                                      return result;
                                  };
                              }
                              function createWrapper(func, bitmask, partialArgs, partialRightArgs, thisArg, arity) {
                                  var isBind = bitmask & 1,
                                      isBindKey = bitmask & 2,
                                      isCurry = bitmask & 4,
                                      isCurryBound = bitmask & 8,
                                      isPartial = bitmask & 16,
                                      isPartialRight = bitmask & 32;
                                  if (!isBindKey && !isFunction(func)) {
                                      throw new TypeError();
                                  }
                                  if (isPartial && !partialArgs.length) {
                                      bitmask &= ~16;
                                      isPartial = partialArgs = false;
                                  }
                                  if (isPartialRight && !partialRightArgs.length) {
                                      bitmask &= ~32;
                                      isPartialRight = partialRightArgs = false;
                                  }
                                  var bindData = func && func.__bindData__;
                                  if (bindData && bindData !== true) {
                                      bindData = slice(bindData);
                                      if (bindData[2]) {
                                          bindData[2] = slice(bindData[2]);
                                      }
                                      if (bindData[3]) {
                                          bindData[3] = slice(bindData[3]);
                                      }
                                      if (isBind && !(bindData[1] & 1)) {
                                          bindData[4] = thisArg;
                                      }
                                      if (!isBind && bindData[1] & 1) {
                                          bitmask |= 8;
                                      }
                                      if (isCurry && !(bindData[1] & 4)) {
                                          bindData[5] = arity;
                                      }
                                      if (isPartial) {
                                          push.apply(bindData[2] || (bindData[2] = []), partialArgs);
                                      }
                                      if (isPartialRight) {
                                          unshift.apply(bindData[3] || (bindData[3] = []), partialRightArgs);
                                      }
                                      bindData[1] |= bitmask;
                                      return createWrapper.apply(null, bindData);
                                  }
                                  var creater = bitmask == 1 || bitmask === 17 ? baseBind : baseCreateWrapper;
                                  return creater([func, bitmask, partialArgs, partialRightArgs, thisArg, arity]);
                              }
                              function escapeHtmlChar(match) {
                                  return htmlEscapes[match];
                              }
                              function getIndexOf() {
                                  var result = (result = lodash.indexOf) === indexOf ? baseIndexOf : result;
                                  return result;
                              }
                              function isNative(value) {
                                  return typeof value == "function" && reNative.test(value);
                              }
                              var setBindData = !defineProperty
                                  ? noop
                                  : function (func, value) {
                                        descriptor.value = value;
                                        defineProperty(func, "__bindData__", descriptor);
                                    };
                              function shimIsPlainObject(value) {
                                  var ctor, result;
                                  if (!(value && toString.call(value) == objectClass) || ((ctor = value.constructor), isFunction(ctor) && !(ctor instanceof ctor))) {
                                      return false;
                                  }
                                  forIn(value, function (value, key) {
                                      result = key;
                                  });
                                  return typeof result == "undefined" || hasOwnProperty.call(value, result);
                              }
                              function unescapeHtmlChar(match) {
                                  return htmlUnescapes[match];
                              }
                              function isArguments(value) {
                                  return (value && typeof value == "object" && typeof value.length == "number" && toString.call(value) == argsClass) || false;
                              }
                              var isArray =
                                  nativeIsArray ||
                                  function (value) {
                                      return (value && typeof value == "object" && typeof value.length == "number" && toString.call(value) == arrayClass) || false;
                                  };
                              var shimKeys = function (object) {
                                  var index,
                                      iterable = object,
                                      result = [];
                                  if (!iterable) return result;
                                  if (!objectTypes[typeof object]) return result;
                                  for (index in iterable) {
                                      if (hasOwnProperty.call(iterable, index)) {
                                          result.push(index);
                                      }
                                  }
                                  return result;
                              };
                              var keys = !nativeKeys
                                  ? shimKeys
                                  : function (object) {
                                        if (!isObject(object)) {
                                            return [];
                                        }
                                        return nativeKeys(object);
                                    };
                              var htmlEscapes = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
                              var htmlUnescapes = invert(htmlEscapes);
                              var reEscapedHtml = RegExp("(" + keys(htmlUnescapes).join("|") + ")", "g"),
                                  reUnescapedHtml = RegExp("[" + keys(htmlEscapes).join("") + "]", "g");
                              var assign = function (object, source, guard) {
                                  var index,
                                      iterable = object,
                                      result = iterable;
                                  if (!iterable) return result;
                                  var args = arguments,
                                      argsIndex = 0,
                                      argsLength = typeof guard == "number" ? 2 : args.length;
                                  if (argsLength > 3 && typeof args[argsLength - 2] == "function") {
                                      var callback = baseCreateCallback(args[--argsLength - 1], args[argsLength--], 2);
                                  } else if (argsLength > 2 && typeof args[argsLength - 1] == "function") {
                                      callback = args[--argsLength];
                                  }
                                  while (++argsIndex < argsLength) {
                                      iterable = args[argsIndex];
                                      if (iterable && objectTypes[typeof iterable]) {
                                          var ownIndex = -1,
                                              ownProps = objectTypes[typeof iterable] && keys(iterable),
                                              length = ownProps ? ownProps.length : 0;
                                          while (++ownIndex < length) {
                                              index = ownProps[ownIndex];
                                              result[index] = callback ? callback(result[index], iterable[index]) : iterable[index];
                                          }
                                      }
                                  }
                                  return result;
                              };
                              function clone(value, isDeep, callback, thisArg) {
                                  if (typeof isDeep != "boolean" && isDeep != null) {
                                      thisArg = callback;
                                      callback = isDeep;
                                      isDeep = false;
                                  }
                                  return baseClone(value, isDeep, typeof callback == "function" && baseCreateCallback(callback, thisArg, 1));
                              }
                              function cloneDeep(value, callback, thisArg) {
                                  return baseClone(value, true, typeof callback == "function" && baseCreateCallback(callback, thisArg, 1));
                              }
                              function create(prototype, properties) {
                                  var result = baseCreate(prototype);
                                  return properties ? assign(result, properties) : result;
                              }
                              var defaults = function (object, source, guard) {
                                  var index,
                                      iterable = object,
                                      result = iterable;
                                  if (!iterable) return result;
                                  var args = arguments,
                                      argsIndex = 0,
                                      argsLength = typeof guard == "number" ? 2 : args.length;
                                  while (++argsIndex < argsLength) {
                                      iterable = args[argsIndex];
                                      if (iterable && objectTypes[typeof iterable]) {
                                          var ownIndex = -1,
                                              ownProps = objectTypes[typeof iterable] && keys(iterable),
                                              length = ownProps ? ownProps.length : 0;
                                          while (++ownIndex < length) {
                                              index = ownProps[ownIndex];
                                              if (typeof result[index] == "undefined") result[index] = iterable[index];
                                          }
                                      }
                                  }
                                  return result;
                              };
                              function findKey(object, callback, thisArg) {
                                  var result;
                                  callback = lodash.createCallback(callback, thisArg, 3);
                                  forOwn(object, function (value, key, object) {
                                      if (callback(value, key, object)) {
                                          result = key;
                                          return false;
                                      }
                                  });
                                  return result;
                              }
                              function findLastKey(object, callback, thisArg) {
                                  var result;
                                  callback = lodash.createCallback(callback, thisArg, 3);
                                  forOwnRight(object, function (value, key, object) {
                                      if (callback(value, key, object)) {
                                          result = key;
                                          return false;
                                      }
                                  });
                                  return result;
                              }
                              var forIn = function (collection, callback, thisArg) {
                                  var index,
                                      iterable = collection,
                                      result = iterable;
                                  if (!iterable) return result;
                                  if (!objectTypes[typeof iterable]) return result;
                                  callback = callback && typeof thisArg == "undefined" ? callback : baseCreateCallback(callback, thisArg, 3);
                                  for (index in iterable) {
                                      if (callback(iterable[index], index, collection) === false) return result;
                                  }
                                  return result;
                              };
                              function forInRight(object, callback, thisArg) {
                                  var pairs = [];
                                  forIn(object, function (value, key) {
                                      pairs.push(key, value);
                                  });
                                  var length = pairs.length;
                                  callback = baseCreateCallback(callback, thisArg, 3);
                                  while (length--) {
                                      if (callback(pairs[length--], pairs[length], object) === false) {
                                          break;
                                      }
                                  }
                                  return object;
                              }
                              var forOwn = function (collection, callback, thisArg) {
                                  var index,
                                      iterable = collection,
                                      result = iterable;
                                  if (!iterable) return result;
                                  if (!objectTypes[typeof iterable]) return result;
                                  callback = callback && typeof thisArg == "undefined" ? callback : baseCreateCallback(callback, thisArg, 3);
                                  var ownIndex = -1,
                                      ownProps = objectTypes[typeof iterable] && keys(iterable),
                                      length = ownProps ? ownProps.length : 0;
                                  while (++ownIndex < length) {
                                      index = ownProps[ownIndex];
                                      if (callback(iterable[index], index, collection) === false) return result;
                                  }
                                  return result;
                              };
                              function forOwnRight(object, callback, thisArg) {
                                  var props = keys(object),
                                      length = props.length;
                                  callback = baseCreateCallback(callback, thisArg, 3);
                                  while (length--) {
                                      var key = props[length];
                                      if (callback(object[key], key, object) === false) {
                                          break;
                                      }
                                  }
                                  return object;
                              }
                              function functions(object) {
                                  var result = [];
                                  forIn(object, function (value, key) {
                                      if (isFunction(value)) {
                                          result.push(key);
                                      }
                                  });
                                  return result.sort();
                              }
                              function has(object, key) {
                                  return object ? hasOwnProperty.call(object, key) : false;
                              }
                              function invert(object) {
                                  var index = -1,
                                      props = keys(object),
                                      length = props.length,
                                      result = {};
                                  while (++index < length) {
                                      var key = props[index];
                                      result[object[key]] = key;
                                  }
                                  return result;
                              }
                              function isBoolean(value) {
                                  return value === true || value === false || (value && typeof value == "object" && toString.call(value) == boolClass) || false;
                              }
                              function isDate(value) {
                                  return (value && typeof value == "object" && toString.call(value) == dateClass) || false;
                              }
                              function isElement(value) {
                                  return (value && value.nodeType === 1) || false;
                              }
                              function isEmpty(value) {
                                  var result = true;
                                  if (!value) {
                                      return result;
                                  }
                                  var className = toString.call(value),
                                      length = value.length;
                                  if (className == arrayClass || className == stringClass || className == argsClass || (className == objectClass && typeof length == "number" && isFunction(value.splice))) {
                                      return !length;
                                  }
                                  forOwn(value, function () {
                                      return (result = false);
                                  });
                                  return result;
                              }
                              function isEqual(a, b, callback, thisArg) {
                                  return baseIsEqual(a, b, typeof callback == "function" && baseCreateCallback(callback, thisArg, 2));
                              }
                              function isFinite(value) {
                                  return nativeIsFinite(value) && !nativeIsNaN(parseFloat(value));
                              }
                              function isFunction(value) {
                                  return typeof value == "function";
                              }
                              function isObject(value) {
                                  return !!(value && objectTypes[typeof value]);
                              }
                              function isNaN(value) {
                                  return isNumber(value) && value != +value;
                              }
                              function isNull(value) {
                                  return value === null;
                              }
                              function isNumber(value) {
                                  return typeof value == "number" || (value && typeof value == "object" && toString.call(value) == numberClass) || false;
                              }
                              var isPlainObject = !getPrototypeOf
                                  ? shimIsPlainObject
                                  : function (value) {
                                        if (!(value && toString.call(value) == objectClass)) {
                                            return false;
                                        }
                                        var valueOf = value.valueOf,
                                            objProto = isNative(valueOf) && (objProto = getPrototypeOf(valueOf)) && getPrototypeOf(objProto);
                                        return objProto ? value == objProto || getPrototypeOf(value) == objProto : shimIsPlainObject(value);
                                    };
                              function isRegExp(value) {
                                  return (value && typeof value == "object" && toString.call(value) == regexpClass) || false;
                              }
                              function isString(value) {
                                  return typeof value == "string" || (value && typeof value == "object" && toString.call(value) == stringClass) || false;
                              }
                              function isUndefined(value) {
                                  return typeof value == "undefined";
                              }
                              function mapValues(object, callback, thisArg) {
                                  var result = {};
                                  callback = lodash.createCallback(callback, thisArg, 3);
                                  forOwn(object, function (value, key, object) {
                                      result[key] = callback(value, key, object);
                                  });
                                  return result;
                              }
                              function merge(object) {
                                  var args = arguments,
                                      length = 2;
                                  if (!isObject(object)) {
                                      return object;
                                  }
                                  if (typeof args[2] != "number") {
                                      length = args.length;
                                  }
                                  if (length > 3 && typeof args[length - 2] == "function") {
                                      var callback = baseCreateCallback(args[--length - 1], args[length--], 2);
                                  } else if (length > 2 && typeof args[length - 1] == "function") {
                                      callback = args[--length];
                                  }
                                  var sources = slice(arguments, 1, length),
                                      index = -1,
                                      stackA = getArray(),
                                      stackB = getArray();
                                  while (++index < length) {
                                      baseMerge(object, sources[index], callback, stackA, stackB);
                                  }
                                  releaseArray(stackA);
                                  releaseArray(stackB);
                                  return object;
                              }
                              function omit(object, callback, thisArg) {
                                  var result = {};
                                  if (typeof callback != "function") {
                                      var props = [];
                                      forIn(object, function (value, key) {
                                          props.push(key);
                                      });
                                      props = baseDifference(props, baseFlatten(arguments, true, false, 1));
                                      var index = -1,
                                          length = props.length;
                                      while (++index < length) {
                                          var key = props[index];
                                          result[key] = object[key];
                                      }
                                  } else {
                                      callback = lodash.createCallback(callback, thisArg, 3);
                                      forIn(object, function (value, key, object) {
                                          if (!callback(value, key, object)) {
                                              result[key] = value;
                                          }
                                      });
                                  }
                                  return result;
                              }
                              function pairs(object) {
                                  var index = -1,
                                      props = keys(object),
                                      length = props.length,
                                      result = Array(length);
                                  while (++index < length) {
                                      var key = props[index];
                                      result[index] = [key, object[key]];
                                  }
                                  return result;
                              }
                              function pick(object, callback, thisArg) {
                                  var result = {};
                                  if (typeof callback != "function") {
                                      var index = -1,
                                          props = baseFlatten(arguments, true, false, 1),
                                          length = isObject(object) ? props.length : 0;
                                      while (++index < length) {
                                          var key = props[index];
                                          if (key in object) {
                                              result[key] = object[key];
                                          }
                                      }
                                  } else {
                                      callback = lodash.createCallback(callback, thisArg, 3);
                                      forIn(object, function (value, key, object) {
                                          if (callback(value, key, object)) {
                                              result[key] = value;
                                          }
                                      });
                                  }
                                  return result;
                              }
                              function transform(object, callback, accumulator, thisArg) {
                                  var isArr = isArray(object);
                                  if (accumulator == null) {
                                      if (isArr) {
                                          accumulator = [];
                                      } else {
                                          var ctor = object && object.constructor,
                                              proto = ctor && ctor.prototype;
                                          accumulator = baseCreate(proto);
                                      }
                                  }
                                  if (callback) {
                                      callback = lodash.createCallback(callback, thisArg, 4);
                                      (isArr ? forEach : forOwn)(object, function (value, index, object) {
                                          return callback(accumulator, value, index, object);
                                      });
                                  }
                                  return accumulator;
                              }
                              function values(object) {
                                  var index = -1,
                                      props = keys(object),
                                      length = props.length,
                                      result = Array(length);
                                  while (++index < length) {
                                      result[index] = object[props[index]];
                                  }
                                  return result;
                              }
                              function at(collection) {
                                  var args = arguments,
                                      index = -1,
                                      props = baseFlatten(args, true, false, 1),
                                      length = args[2] && args[2][args[1]] === collection ? 1 : props.length,
                                      result = Array(length);
                                  while (++index < length) {
                                      result[index] = collection[props[index]];
                                  }
                                  return result;
                              }
                              function contains(collection, target, fromIndex) {
                                  var index = -1,
                                      indexOf = getIndexOf(),
                                      length = collection ? collection.length : 0,
                                      result = false;
                                  fromIndex = (fromIndex < 0 ? nativeMax(0, length + fromIndex) : fromIndex) || 0;
                                  if (isArray(collection)) {
                                      result = indexOf(collection, target, fromIndex) > -1;
                                  } else if (typeof length == "number") {
                                      result = (isString(collection) ? collection.indexOf(target, fromIndex) : indexOf(collection, target, fromIndex)) > -1;
                                  } else {
                                      forOwn(collection, function (value) {
                                          if (++index >= fromIndex) {
                                              return !(result = value === target);
                                          }
                                      });
                                  }
                                  return result;
                              }
                              var countBy = createAggregator(function (result, value, key) {
                                  hasOwnProperty.call(result, key) ? result[key]++ : (result[key] = 1);
                              });
                              function every(collection, callback, thisArg) {
                                  var result = true;
                                  callback = lodash.createCallback(callback, thisArg, 3);
                                  var index = -1,
                                      length = collection ? collection.length : 0;
                                  if (typeof length == "number") {
                                      while (++index < length) {
                                          if (!(result = !!callback(collection[index], index, collection))) {
                                              break;
                                          }
                                      }
                                  } else {
                                      forOwn(collection, function (value, index, collection) {
                                          return (result = !!callback(value, index, collection));
                                      });
                                  }
                                  return result;
                              }
                              function filter(collection, callback, thisArg) {
                                  var result = [];
                                  callback = lodash.createCallback(callback, thisArg, 3);
                                  var index = -1,
                                      length = collection ? collection.length : 0;
                                  if (typeof length == "number") {
                                      while (++index < length) {
                                          var value = collection[index];
                                          if (callback(value, index, collection)) {
                                              result.push(value);
                                          }
                                      }
                                  } else {
                                      forOwn(collection, function (value, index, collection) {
                                          if (callback(value, index, collection)) {
                                              result.push(value);
                                          }
                                      });
                                  }
                                  return result;
                              }
                              function find(collection, callback, thisArg) {
                                  callback = lodash.createCallback(callback, thisArg, 3);
                                  var index = -1,
                                      length = collection ? collection.length : 0;
                                  if (typeof length == "number") {
                                      while (++index < length) {
                                          var value = collection[index];
                                          if (callback(value, index, collection)) {
                                              return value;
                                          }
                                      }
                                  } else {
                                      var result;
                                      forOwn(collection, function (value, index, collection) {
                                          if (callback(value, index, collection)) {
                                              result = value;
                                              return false;
                                          }
                                      });
                                      return result;
                                  }
                              }
                              function findLast(collection, callback, thisArg) {
                                  var result;
                                  callback = lodash.createCallback(callback, thisArg, 3);
                                  forEachRight(collection, function (value, index, collection) {
                                      if (callback(value, index, collection)) {
                                          result = value;
                                          return false;
                                      }
                                  });
                                  return result;
                              }
                              function forEach(collection, callback, thisArg) {
                                  var index = -1,
                                      length = collection ? collection.length : 0;
                                  callback = callback && typeof thisArg == "undefined" ? callback : baseCreateCallback(callback, thisArg, 3);
                                  if (typeof length == "number") {
                                      while (++index < length) {
                                          if (callback(collection[index], index, collection) === false) {
                                              break;
                                          }
                                      }
                                  } else {
                                      forOwn(collection, callback);
                                  }
                                  return collection;
                              }
                              function forEachRight(collection, callback, thisArg) {
                                  var length = collection ? collection.length : 0;
                                  callback = callback && typeof thisArg == "undefined" ? callback : baseCreateCallback(callback, thisArg, 3);
                                  if (typeof length == "number") {
                                      while (length--) {
                                          if (callback(collection[length], length, collection) === false) {
                                              break;
                                          }
                                      }
                                  } else {
                                      var props = keys(collection);
                                      length = props.length;
                                      forOwn(collection, function (value, key, collection) {
                                          key = props ? props[--length] : --length;
                                          return callback(collection[key], key, collection);
                                      });
                                  }
                                  return collection;
                              }
                              var groupBy = createAggregator(function (result, value, key) {
                                  (hasOwnProperty.call(result, key) ? result[key] : (result[key] = [])).push(value);
                              });
                              var indexBy = createAggregator(function (result, value, key) {
                                  result[key] = value;
                              });
                              function invoke(collection, methodName) {
                                  var args = slice(arguments, 2),
                                      index = -1,
                                      isFunc = typeof methodName == "function",
                                      length = collection ? collection.length : 0,
                                      result = Array(typeof length == "number" ? length : 0);
                                  forEach(collection, function (value) {
                                      result[++index] = (isFunc ? methodName : value[methodName]).apply(value, args);
                                  });
                                  return result;
                              }
                              function map(collection, callback, thisArg) {
                                  var index = -1,
                                      length = collection ? collection.length : 0;
                                  callback = lodash.createCallback(callback, thisArg, 3);
                                  if (typeof length == "number") {
                                      var result = Array(length);
                                      while (++index < length) {
                                          result[index] = callback(collection[index], index, collection);
                                      }
                                  } else {
                                      result = [];
                                      forOwn(collection, function (value, key, collection) {
                                          result[++index] = callback(value, key, collection);
                                      });
                                  }
                                  return result;
                              }
                              function max(collection, callback, thisArg) {
                                  var computed = -Infinity,
                                      result = computed;
                                  if (typeof callback != "function" && thisArg && thisArg[callback] === collection) {
                                      callback = null;
                                  }
                                  if (callback == null && isArray(collection)) {
                                      var index = -1,
                                          length = collection.length;
                                      while (++index < length) {
                                          var value = collection[index];
                                          if (value > result) {
                                              result = value;
                                          }
                                      }
                                  } else {
                                      callback = callback == null && isString(collection) ? charAtCallback : lodash.createCallback(callback, thisArg, 3);
                                      forEach(collection, function (value, index, collection) {
                                          var current = callback(value, index, collection);
                                          if (current > computed) {
                                              computed = current;
                                              result = value;
                                          }
                                      });
                                  }
                                  return result;
                              }
                              function min(collection, callback, thisArg) {
                                  var computed = Infinity,
                                      result = computed;
                                  if (typeof callback != "function" && thisArg && thisArg[callback] === collection) {
                                      callback = null;
                                  }
                                  if (callback == null && isArray(collection)) {
                                      var index = -1,
                                          length = collection.length;
                                      while (++index < length) {
                                          var value = collection[index];
                                          if (value < result) {
                                              result = value;
                                          }
                                      }
                                  } else {
                                      callback = callback == null && isString(collection) ? charAtCallback : lodash.createCallback(callback, thisArg, 3);
                                      forEach(collection, function (value, index, collection) {
                                          var current = callback(value, index, collection);
                                          if (current < computed) {
                                              computed = current;
                                              result = value;
                                          }
                                      });
                                  }
                                  return result;
                              }
                              var pluck = map;
                              function reduce(collection, callback, accumulator, thisArg) {
                                  if (!collection) return accumulator;
                                  var noaccum = arguments.length < 3;
                                  callback = lodash.createCallback(callback, thisArg, 4);
                                  var index = -1,
                                      length = collection.length;
                                  if (typeof length == "number") {
                                      if (noaccum) {
                                          accumulator = collection[++index];
                                      }
                                      while (++index < length) {
                                          accumulator = callback(accumulator, collection[index], index, collection);
                                      }
                                  } else {
                                      forOwn(collection, function (value, index, collection) {
                                          accumulator = noaccum ? ((noaccum = false), value) : callback(accumulator, value, index, collection);
                                      });
                                  }
                                  return accumulator;
                              }
                              function reduceRight(collection, callback, accumulator, thisArg) {
                                  var noaccum = arguments.length < 3;
                                  callback = lodash.createCallback(callback, thisArg, 4);
                                  forEachRight(collection, function (value, index, collection) {
                                      accumulator = noaccum ? ((noaccum = false), value) : callback(accumulator, value, index, collection);
                                  });
                                  return accumulator;
                              }
                              function reject(collection, callback, thisArg) {
                                  callback = lodash.createCallback(callback, thisArg, 3);
                                  return filter(collection, function (value, index, collection) {
                                      return !callback(value, index, collection);
                                  });
                              }
                              function sample(collection, n, guard) {
                                  if (collection && typeof collection.length != "number") {
                                      collection = values(collection);
                                  }
                                  if (n == null || guard) {
                                      return collection ? collection[baseRandom(0, collection.length - 1)] : undefined;
                                  }
                                  var result = shuffle(collection);
                                  result.length = nativeMin(nativeMax(0, n), result.length);
                                  return result;
                              }
                              function shuffle(collection) {
                                  var index = -1,
                                      length = collection ? collection.length : 0,
                                      result = Array(typeof length == "number" ? length : 0);
                                  forEach(collection, function (value) {
                                      var rand = baseRandom(0, ++index);
                                      result[index] = result[rand];
                                      result[rand] = value;
                                  });
                                  return result;
                              }
                              function size(collection) {
                                  var length = collection ? collection.length : 0;
                                  return typeof length == "number" ? length : keys(collection).length;
                              }
                              function some(collection, callback, thisArg) {
                                  var result;
                                  callback = lodash.createCallback(callback, thisArg, 3);
                                  var index = -1,
                                      length = collection ? collection.length : 0;
                                  if (typeof length == "number") {
                                      while (++index < length) {
                                          if ((result = callback(collection[index], index, collection))) {
                                              break;
                                          }
                                      }
                                  } else {
                                      forOwn(collection, function (value, index, collection) {
                                          return !(result = callback(value, index, collection));
                                      });
                                  }
                                  return !!result;
                              }
                              function sortBy(collection, callback, thisArg) {
                                  var index = -1,
                                      isArr = isArray(callback),
                                      length = collection ? collection.length : 0,
                                      result = Array(typeof length == "number" ? length : 0);
                                  if (!isArr) {
                                      callback = lodash.createCallback(callback, thisArg, 3);
                                  }
                                  forEach(collection, function (value, key, collection) {
                                      var object = (result[++index] = getObject());
                                      if (isArr) {
                                          object.criteria = map(callback, function (key) {
                                              return value[key];
                                          });
                                      } else {
                                          (object.criteria = getArray())[0] = callback(value, key, collection);
                                      }
                                      object.index = index;
                                      object.value = value;
                                  });
                                  length = result.length;
                                  result.sort(compareAscending);
                                  while (length--) {
                                      var object = result[length];
                                      result[length] = object.value;
                                      if (!isArr) {
                                          releaseArray(object.criteria);
                                      }
                                      releaseObject(object);
                                  }
                                  return result;
                              }
                              function toArray(collection) {
                                  if (collection && typeof collection.length == "number") {
                                      return slice(collection);
                                  }
                                  return values(collection);
                              }
                              var where = filter;
                              function compact(array) {
                                  var index = -1,
                                      length = array ? array.length : 0,
                                      result = [];
                                  while (++index < length) {
                                      var value = array[index];
                                      if (value) {
                                          result.push(value);
                                      }
                                  }
                                  return result;
                              }
                              function difference(array) {
                                  return baseDifference(array, baseFlatten(arguments, true, true, 1));
                              }
                              function findIndex(array, callback, thisArg) {
                                  var index = -1,
                                      length = array ? array.length : 0;
                                  callback = lodash.createCallback(callback, thisArg, 3);
                                  while (++index < length) {
                                      if (callback(array[index], index, array)) {
                                          return index;
                                      }
                                  }
                                  return -1;
                              }
                              function findLastIndex(array, callback, thisArg) {
                                  var length = array ? array.length : 0;
                                  callback = lodash.createCallback(callback, thisArg, 3);
                                  while (length--) {
                                      if (callback(array[length], length, array)) {
                                          return length;
                                      }
                                  }
                                  return -1;
                              }
                              function first(array, callback, thisArg) {
                                  var n = 0,
                                      length = array ? array.length : 0;
                                  if (typeof callback != "number" && callback != null) {
                                      var index = -1;
                                      callback = lodash.createCallback(callback, thisArg, 3);
                                      while (++index < length && callback(array[index], index, array)) {
                                          n++;
                                      }
                                  } else {
                                      n = callback;
                                      if (n == null || thisArg) {
                                          return array ? array[0] : undefined;
                                      }
                                  }
                                  return slice(array, 0, nativeMin(nativeMax(0, n), length));
                              }
                              function flatten(array, isShallow, callback, thisArg) {
                                  if (typeof isShallow != "boolean" && isShallow != null) {
                                      thisArg = callback;
                                      callback = typeof isShallow != "function" && thisArg && thisArg[isShallow] === array ? null : isShallow;
                                      isShallow = false;
                                  }
                                  if (callback != null) {
                                      array = map(array, callback, thisArg);
                                  }
                                  return baseFlatten(array, isShallow);
                              }
                              function indexOf(array, value, fromIndex) {
                                  if (typeof fromIndex == "number") {
                                      var length = array ? array.length : 0;
                                      fromIndex = fromIndex < 0 ? nativeMax(0, length + fromIndex) : fromIndex || 0;
                                  } else if (fromIndex) {
                                      var index = sortedIndex(array, value);
                                      return array[index] === value ? index : -1;
                                  }
                                  return baseIndexOf(array, value, fromIndex);
                              }
                              function initial(array, callback, thisArg) {
                                  var n = 0,
                                      length = array ? array.length : 0;
                                  if (typeof callback != "number" && callback != null) {
                                      var index = length;
                                      callback = lodash.createCallback(callback, thisArg, 3);
                                      while (index-- && callback(array[index], index, array)) {
                                          n++;
                                      }
                                  } else {
                                      n = callback == null || thisArg ? 1 : callback || n;
                                  }
                                  return slice(array, 0, nativeMin(nativeMax(0, length - n), length));
                              }
                              function intersection() {
                                  var args = [],
                                      argsIndex = -1,
                                      argsLength = arguments.length,
                                      caches = getArray(),
                                      indexOf = getIndexOf(),
                                      trustIndexOf = indexOf === baseIndexOf,
                                      seen = getArray();
                                  while (++argsIndex < argsLength) {
                                      var value = arguments[argsIndex];
                                      if (isArray(value) || isArguments(value)) {
                                          args.push(value);
                                          caches.push(trustIndexOf && value.length >= largeArraySize && createCache(argsIndex ? args[argsIndex] : seen));
                                      }
                                  }
                                  var array = args[0],
                                      index = -1,
                                      length = array ? array.length : 0,
                                      result = [];
                                  outer: while (++index < length) {
                                      var cache = caches[0];
                                      value = array[index];
                                      if ((cache ? cacheIndexOf(cache, value) : indexOf(seen, value)) < 0) {
                                          argsIndex = argsLength;
                                          (cache || seen).push(value);
                                          while (--argsIndex) {
                                              cache = caches[argsIndex];
                                              if ((cache ? cacheIndexOf(cache, value) : indexOf(args[argsIndex], value)) < 0) {
                                                  continue outer;
                                              }
                                          }
                                          result.push(value);
                                      }
                                  }
                                  while (argsLength--) {
                                      cache = caches[argsLength];
                                      if (cache) {
                                          releaseObject(cache);
                                      }
                                  }
                                  releaseArray(caches);
                                  releaseArray(seen);
                                  return result;
                              }
                              function last(array, callback, thisArg) {
                                  var n = 0,
                                      length = array ? array.length : 0;
                                  if (typeof callback != "number" && callback != null) {
                                      var index = length;
                                      callback = lodash.createCallback(callback, thisArg, 3);
                                      while (index-- && callback(array[index], index, array)) {
                                          n++;
                                      }
                                  } else {
                                      n = callback;
                                      if (n == null || thisArg) {
                                          return array ? array[length - 1] : undefined;
                                      }
                                  }
                                  return slice(array, nativeMax(0, length - n));
                              }
                              function lastIndexOf(array, value, fromIndex) {
                                  var index = array ? array.length : 0;
                                  if (typeof fromIndex == "number") {
                                      index = (fromIndex < 0 ? nativeMax(0, index + fromIndex) : nativeMin(fromIndex, index - 1)) + 1;
                                  }
                                  while (index--) {
                                      if (array[index] === value) {
                                          return index;
                                      }
                                  }
                                  return -1;
                              }
                              function pull(array) {
                                  var args = arguments,
                                      argsIndex = 0,
                                      argsLength = args.length,
                                      length = array ? array.length : 0;
                                  while (++argsIndex < argsLength) {
                                      var index = -1,
                                          value = args[argsIndex];
                                      while (++index < length) {
                                          if (array[index] === value) {
                                              splice.call(array, index--, 1);
                                              length--;
                                          }
                                      }
                                  }
                                  return array;
                              }
                              function range(start, end, step) {
                                  start = +start || 0;
                                  step = typeof step == "number" ? step : +step || 1;
                                  if (end == null) {
                                      end = start;
                                      start = 0;
                                  }
                                  var index = -1,
                                      length = nativeMax(0, ceil((end - start) / (step || 1))),
                                      result = Array(length);
                                  while (++index < length) {
                                      result[index] = start;
                                      start += step;
                                  }
                                  return result;
                              }
                              function remove(array, callback, thisArg) {
                                  var index = -1,
                                      length = array ? array.length : 0,
                                      result = [];
                                  callback = lodash.createCallback(callback, thisArg, 3);
                                  while (++index < length) {
                                      var value = array[index];
                                      if (callback(value, index, array)) {
                                          result.push(value);
                                          splice.call(array, index--, 1);
                                          length--;
                                      }
                                  }
                                  return result;
                              }
                              function rest(array, callback, thisArg) {
                                  if (typeof callback != "number" && callback != null) {
                                      var n = 0,
                                          index = -1,
                                          length = array ? array.length : 0;
                                      callback = lodash.createCallback(callback, thisArg, 3);
                                      while (++index < length && callback(array[index], index, array)) {
                                          n++;
                                      }
                                  } else {
                                      n = callback == null || thisArg ? 1 : nativeMax(0, callback);
                                  }
                                  return slice(array, n);
                              }
                              function sortedIndex(array, value, callback, thisArg) {
                                  var low = 0,
                                      high = array ? array.length : low;
                                  callback = callback ? lodash.createCallback(callback, thisArg, 1) : identity;
                                  value = callback(value);
                                  while (low < high) {
                                      var mid = (low + high) >>> 1;
                                      callback(array[mid]) < value ? (low = mid + 1) : (high = mid);
                                  }
                                  return low;
                              }
                              function union() {
                                  return baseUniq(baseFlatten(arguments, true, true));
                              }
                              function uniq(array, isSorted, callback, thisArg) {
                                  if (typeof isSorted != "boolean" && isSorted != null) {
                                      thisArg = callback;
                                      callback = typeof isSorted != "function" && thisArg && thisArg[isSorted] === array ? null : isSorted;
                                      isSorted = false;
                                  }
                                  if (callback != null) {
                                      callback = lodash.createCallback(callback, thisArg, 3);
                                  }
                                  return baseUniq(array, isSorted, callback);
                              }
                              function without(array) {
                                  return baseDifference(array, slice(arguments, 1));
                              }
                              function xor() {
                                  var index = -1,
                                      length = arguments.length;
                                  while (++index < length) {
                                      var array = arguments[index];
                                      if (isArray(array) || isArguments(array)) {
                                          var result = result ? baseUniq(baseDifference(result, array).concat(baseDifference(array, result))) : array;
                                      }
                                  }
                                  return result || [];
                              }
                              function zip() {
                                  var array = arguments.length > 1 ? arguments : arguments[0],
                                      index = -1,
                                      length = array ? max(pluck(array, "length")) : 0,
                                      result = Array(length < 0 ? 0 : length);
                                  while (++index < length) {
                                      result[index] = pluck(array, index);
                                  }
                                  return result;
                              }
                              function zipObject(keys, values) {
                                  var index = -1,
                                      length = keys ? keys.length : 0,
                                      result = {};
                                  if (!values && length && !isArray(keys[0])) {
                                      values = [];
                                  }
                                  while (++index < length) {
                                      var key = keys[index];
                                      if (values) {
                                          result[key] = values[index];
                                      } else if (key) {
                                          result[key[0]] = key[1];
                                      }
                                  }
                                  return result;
                              }
                              function after(n, func) {
                                  if (!isFunction(func)) {
                                      throw new TypeError();
                                  }
                                  return function () {
                                      if (--n < 1) {
                                          return func.apply(this, arguments);
                                      }
                                  };
                              }
                              function bind(func, thisArg) {
                                  return arguments.length > 2 ? createWrapper(func, 17, slice(arguments, 2), null, thisArg) : createWrapper(func, 1, null, null, thisArg);
                              }
                              function bindAll(object) {
                                  var funcs = arguments.length > 1 ? baseFlatten(arguments, true, false, 1) : functions(object),
                                      index = -1,
                                      length = funcs.length;
                                  while (++index < length) {
                                      var key = funcs[index];
                                      object[key] = createWrapper(object[key], 1, null, null, object);
                                  }
                                  return object;
                              }
                              function bindKey(object, key) {
                                  return arguments.length > 2 ? createWrapper(key, 19, slice(arguments, 2), null, object) : createWrapper(key, 3, null, null, object);
                              }
                              function compose() {
                                  var funcs = arguments,
                                      length = funcs.length;
                                  while (length--) {
                                      if (!isFunction(funcs[length])) {
                                          throw new TypeError();
                                      }
                                  }
                                  return function () {
                                      var args = arguments,
                                          length = funcs.length;
                                      while (length--) {
                                          args = [funcs[length].apply(this, args)];
                                      }
                                      return args[0];
                                  };
                              }
                              function curry(func, arity) {
                                  arity = typeof arity == "number" ? arity : +arity || func.length;
                                  return createWrapper(func, 4, null, null, null, arity);
                              }
                              function debounce(func, wait, options) {
                                  var args,
                                      maxTimeoutId,
                                      result,
                                      stamp,
                                      thisArg,
                                      timeoutId,
                                      trailingCall,
                                      lastCalled = 0,
                                      maxWait = false,
                                      trailing = true;
                                  if (!isFunction(func)) {
                                      throw new TypeError();
                                  }
                                  wait = nativeMax(0, wait) || 0;
                                  if (options === true) {
                                      var leading = true;
                                      trailing = false;
                                  } else if (isObject(options)) {
                                      leading = options.leading;
                                      maxWait = "maxWait" in options && (nativeMax(wait, options.maxWait) || 0);
                                      trailing = "trailing" in options ? options.trailing : trailing;
                                  }
                                  var delayed = function () {
                                      var remaining = wait - (now() - stamp);
                                      if (remaining <= 0) {
                                          if (maxTimeoutId) {
                                              clearTimeout(maxTimeoutId);
                                          }
                                          var isCalled = trailingCall;
                                          maxTimeoutId = timeoutId = trailingCall = undefined;
                                          if (isCalled) {
                                              lastCalled = now();
                                              result = func.apply(thisArg, args);
                                              if (!timeoutId && !maxTimeoutId) {
                                                  args = thisArg = null;
                                              }
                                          }
                                      } else {
                                          timeoutId = setTimeout(delayed, remaining);
                                      }
                                  };
                                  var maxDelayed = function () {
                                      if (timeoutId) {
                                          clearTimeout(timeoutId);
                                      }
                                      maxTimeoutId = timeoutId = trailingCall = undefined;
                                      if (trailing || maxWait !== wait) {
                                          lastCalled = now();
                                          result = func.apply(thisArg, args);
                                          if (!timeoutId && !maxTimeoutId) {
                                              args = thisArg = null;
                                          }
                                      }
                                  };
                                  return function () {
                                      args = arguments;
                                      stamp = now();
                                      thisArg = this;
                                      trailingCall = trailing && (timeoutId || !leading);
                                      if (maxWait === false) {
                                          var leadingCall = leading && !timeoutId;
                                      } else {
                                          if (!maxTimeoutId && !leading) {
                                              lastCalled = stamp;
                                          }
                                          var remaining = maxWait - (stamp - lastCalled),
                                              isCalled = remaining <= 0;
                                          if (isCalled) {
                                              if (maxTimeoutId) {
                                                  maxTimeoutId = clearTimeout(maxTimeoutId);
                                              }
                                              lastCalled = stamp;
                                              result = func.apply(thisArg, args);
                                          } else if (!maxTimeoutId) {
                                              maxTimeoutId = setTimeout(maxDelayed, remaining);
                                          }
                                      }
                                      if (isCalled && timeoutId) {
                                          timeoutId = clearTimeout(timeoutId);
                                      } else if (!timeoutId && wait !== maxWait) {
                                          timeoutId = setTimeout(delayed, wait);
                                      }
                                      if (leadingCall) {
                                          isCalled = true;
                                          result = func.apply(thisArg, args);
                                      }
                                      if (isCalled && !timeoutId && !maxTimeoutId) {
                                          args = thisArg = null;
                                      }
                                      return result;
                                  };
                              }
                              function defer(func) {
                                  if (!isFunction(func)) {
                                      throw new TypeError();
                                  }
                                  var args = slice(arguments, 1);
                                  return setTimeout(function () {
                                      func.apply(undefined, args);
                                  }, 1);
                              }
                              function delay(func, wait) {
                                  if (!isFunction(func)) {
                                      throw new TypeError();
                                  }
                                  var args = slice(arguments, 2);
                                  return setTimeout(function () {
                                      func.apply(undefined, args);
                                  }, wait);
                              }
                              function memoize(func, resolver) {
                                  if (!isFunction(func)) {
                                      throw new TypeError();
                                  }
                                  var memoized = function () {
                                      var cache = memoized.cache,
                                          key = resolver ? resolver.apply(this, arguments) : keyPrefix + arguments[0];
                                      return hasOwnProperty.call(cache, key) ? cache[key] : (cache[key] = func.apply(this, arguments));
                                  };
                                  memoized.cache = {};
                                  return memoized;
                              }
                              function once(func) {
                                  var ran, result;
                                  if (!isFunction(func)) {
                                      throw new TypeError();
                                  }
                                  return function () {
                                      if (ran) {
                                          return result;
                                      }
                                      ran = true;
                                      result = func.apply(this, arguments);
                                      func = null;
                                      return result;
                                  };
                              }
                              function partial(func) {
                                  return createWrapper(func, 16, slice(arguments, 1));
                              }
                              function partialRight(func) {
                                  return createWrapper(func, 32, null, slice(arguments, 1));
                              }
                              function throttle(func, wait, options) {
                                  var leading = true,
                                      trailing = true;
                                  if (!isFunction(func)) {
                                      throw new TypeError();
                                  }
                                  if (options === false) {
                                      leading = false;
                                  } else if (isObject(options)) {
                                      leading = "leading" in options ? options.leading : leading;
                                      trailing = "trailing" in options ? options.trailing : trailing;
                                  }
                                  debounceOptions.leading = leading;
                                  debounceOptions.maxWait = wait;
                                  debounceOptions.trailing = trailing;
                                  return debounce(func, wait, debounceOptions);
                              }
                              function wrap(value, wrapper) {
                                  return createWrapper(wrapper, 16, [value]);
                              }
                              function constant(value) {
                                  return function () {
                                      return value;
                                  };
                              }
                              function createCallback(func, thisArg, argCount) {
                                  var type = typeof func;
                                  if (func == null || type == "function") {
                                      return baseCreateCallback(func, thisArg, argCount);
                                  }
                                  if (type != "object") {
                                      return property(func);
                                  }
                                  var props = keys(func),
                                      key = props[0],
                                      a = func[key];
                                  if (props.length == 1 && a === a && !isObject(a)) {
                                      return function (object) {
                                          var b = object[key];
                                          return a === b && (a !== 0 || 1 / a == 1 / b);
                                      };
                                  }
                                  return function (object) {
                                      var length = props.length,
                                          result = false;
                                      while (length--) {
                                          if (!(result = baseIsEqual(object[props[length]], func[props[length]], null, true))) {
                                              break;
                                          }
                                      }
                                      return result;
                                  };
                              }
                              function escape(string) {
                                  return string == null ? "" : String(string).replace(reUnescapedHtml, escapeHtmlChar);
                              }
                              function identity(value) {
                                  return value;
                              }
                              function mixin(object, source, options) {
                                  var chain = true,
                                      methodNames = source && functions(source);
                                  if (!source || (!options && !methodNames.length)) {
                                      if (options == null) {
                                          options = source;
                                      }
                                      ctor = lodashWrapper;
                                      source = object;
                                      object = lodash;
                                      methodNames = functions(source);
                                  }
                                  if (options === false) {
                                      chain = false;
                                  } else if (isObject(options) && "chain" in options) {
                                      chain = options.chain;
                                  }
                                  var ctor = object,
                                      isFunc = isFunction(ctor);
                                  forEach(methodNames, function (methodName) {
                                      var func = (object[methodName] = source[methodName]);
                                      if (isFunc) {
                                          ctor.prototype[methodName] = function () {
                                              var chainAll = this.__chain__,
                                                  value = this.__wrapped__,
                                                  args = [value];
                                              push.apply(args, arguments);
                                              var result = func.apply(object, args);
                                              if (chain || chainAll) {
                                                  if (value === result && isObject(result)) {
                                                      return this;
                                                  }
                                                  result = new ctor(result);
                                                  result.__chain__ = chainAll;
                                              }
                                              return result;
                                          };
                                      }
                                  });
                              }
                              function noConflict() {
                                  context._ = oldDash;
                                  return this;
                              }
                              function noop() {}
                              var now =
                                  (isNative((now = Date.now)) && now) ||
                                  function () {
                                      return new Date().getTime();
                                  };
                              var parseInt =
                                  nativeParseInt(whitespace + "08") == 8
                                      ? nativeParseInt
                                      : function (value, radix) {
                                            return nativeParseInt(isString(value) ? value.replace(reLeadingSpacesAndZeros, "") : value, radix || 0);
                                        };
                              function property(key) {
                                  return function (object) {
                                      return object[key];
                                  };
                              }
                              function random(min, max, floating) {
                                  var noMin = min == null,
                                      noMax = max == null;
                                  if (floating == null) {
                                      if (typeof min == "boolean" && noMax) {
                                          floating = min;
                                          min = 1;
                                      } else if (!noMax && typeof max == "boolean") {
                                          floating = max;
                                          noMax = true;
                                      }
                                  }
                                  if (noMin && noMax) {
                                      max = 1;
                                  }
                                  min = +min || 0;
                                  if (noMax) {
                                      max = min;
                                      min = 0;
                                  } else {
                                      max = +max || 0;
                                  }
                                  if (floating || min % 1 || max % 1) {
                                      var rand = nativeRandom();
                                      return nativeMin(min + rand * (max - min + parseFloat("1e-" + ((rand + "").length - 1))), max);
                                  }
                                  return baseRandom(min, max);
                              }
                              function result(object, key) {
                                  if (object) {
                                      var value = object[key];
                                      return isFunction(value) ? object[key]() : value;
                                  }
                              }
                              function template(text, data, options) {
                                  var settings = lodash.templateSettings;
                                  text = String(text || "");
                                  options = defaults({}, options, settings);
                                  var imports = defaults({}, options.imports, settings.imports),
                                      importsKeys = keys(imports),
                                      importsValues = values(imports);
                                  var isEvaluating,
                                      index = 0,
                                      interpolate = options.interpolate || reNoMatch,
                                      source = "__p += '";
                                  var reDelimiters = RegExp(
                                      (options.escape || reNoMatch).source + "|" + interpolate.source + "|" + (interpolate === reInterpolate ? reEsTemplate : reNoMatch).source + "|" + (options.evaluate || reNoMatch).source + "|$",
                                      "g"
                                  );
                                  text.replace(reDelimiters, function (match, escapeValue, interpolateValue, esTemplateValue, evaluateValue, offset) {
                                      interpolateValue || (interpolateValue = esTemplateValue);
                                      source += text.slice(index, offset).replace(reUnescapedString, escapeStringChar);
                                      if (escapeValue) {
                                          source += "' +\n__e(" + escapeValue + ") +\n'";
                                      }
                                      if (evaluateValue) {
                                          isEvaluating = true;
                                          source += "';\n" + evaluateValue + ";\n__p += '";
                                      }
                                      if (interpolateValue) {
                                          source += "' +\n((__t = (" + interpolateValue + ")) == null ? '' : __t) +\n'";
                                      }
                                      index = offset + match.length;
                                      return match;
                                  });
                                  source += "';\n";
                                  var variable = options.variable,
                                      hasVariable = variable;
                                  if (!hasVariable) {
                                      variable = "obj";
                                      source = "with (" + variable + ") {\n" + source + "\n}\n";
                                  }
                                  source = (isEvaluating ? source.replace(reEmptyStringLeading, "") : source).replace(reEmptyStringMiddle, "$1").replace(reEmptyStringTrailing, "$1;");
                                  source =
                                      "function(" +
                                      variable +
                                      ") {\n" +
                                      (hasVariable ? "" : variable + " || (" + variable + " = {});\n") +
                                      "var __t, __p = '', __e = _.escape" +
                                      (isEvaluating ? ", __j = Array.prototype.join;\n" + "function print() { __p += __j.call(arguments, '') }\n" : ";\n") +
                                      source +
                                      "return __p\n}";
                                  var sourceURL = "\n/*\n//# sourceURL=" + (options.sourceURL || "/lodash/template/source[" + templateCounter++ + "]") + "\n*/";
                                  try {
                                      var result = Function(importsKeys, "return " + source + sourceURL).apply(undefined, importsValues);
                                  } catch (e) {
                                      e.source = source;
                                      throw e;
                                  }
                                  if (data) {
                                      return result(data);
                                  }
                                  result.source = source;
                                  return result;
                              }
                              function times(n, callback, thisArg) {
                                  n = (n = +n) > -1 ? n : 0;
                                  var index = -1,
                                      result = Array(n);
                                  callback = baseCreateCallback(callback, thisArg, 1);
                                  while (++index < n) {
                                      result[index] = callback(index);
                                  }
                                  return result;
                              }
                              function unescape(string) {
                                  return string == null ? "" : String(string).replace(reEscapedHtml, unescapeHtmlChar);
                              }
                              function uniqueId(prefix) {
                                  var id = ++idCounter;
                                  return String(prefix == null ? "" : prefix) + id;
                              }
                              function chain(value) {
                                  value = new lodashWrapper(value);
                                  value.__chain__ = true;
                                  return value;
                              }
                              function tap(value, interceptor) {
                                  interceptor(value);
                                  return value;
                              }
                              function wrapperChain() {
                                  this.__chain__ = true;
                                  return this;
                              }
                              function wrapperToString() {
                                  return String(this.__wrapped__);
                              }
                              function wrapperValueOf() {
                                  return this.__wrapped__;
                              }
                              lodash.after = after;
                              lodash.assign = assign;
                              lodash.at = at;
                              lodash.bind = bind;
                              lodash.bindAll = bindAll;
                              lodash.bindKey = bindKey;
                              lodash.chain = chain;
                              lodash.compact = compact;
                              lodash.compose = compose;
                              lodash.constant = constant;
                              lodash.countBy = countBy;
                              lodash.create = create;
                              lodash.createCallback = createCallback;
                              lodash.curry = curry;
                              lodash.debounce = debounce;
                              lodash.defaults = defaults;
                              lodash.defer = defer;
                              lodash.delay = delay;
                              lodash.difference = difference;
                              lodash.filter = filter;
                              lodash.flatten = flatten;
                              lodash.forEach = forEach;
                              lodash.forEachRight = forEachRight;
                              lodash.forIn = forIn;
                              lodash.forInRight = forInRight;
                              lodash.forOwn = forOwn;
                              lodash.forOwnRight = forOwnRight;
                              lodash.functions = functions;
                              lodash.groupBy = groupBy;
                              lodash.indexBy = indexBy;
                              lodash.initial = initial;
                              lodash.intersection = intersection;
                              lodash.invert = invert;
                              lodash.invoke = invoke;
                              lodash.keys = keys;
                              lodash.map = map;
                              lodash.mapValues = mapValues;
                              lodash.max = max;
                              lodash.memoize = memoize;
                              lodash.merge = merge;
                              lodash.min = min;
                              lodash.omit = omit;
                              lodash.once = once;
                              lodash.pairs = pairs;
                              lodash.partial = partial;
                              lodash.partialRight = partialRight;
                              lodash.pick = pick;
                              lodash.pluck = pluck;
                              lodash.property = property;
                              lodash.pull = pull;
                              lodash.range = range;
                              lodash.reject = reject;
                              lodash.remove = remove;
                              lodash.rest = rest;
                              lodash.shuffle = shuffle;
                              lodash.sortBy = sortBy;
                              lodash.tap = tap;
                              lodash.throttle = throttle;
                              lodash.times = times;
                              lodash.toArray = toArray;
                              lodash.transform = transform;
                              lodash.union = union;
                              lodash.uniq = uniq;
                              lodash.values = values;
                              lodash.where = where;
                              lodash.without = without;
                              lodash.wrap = wrap;
                              lodash.xor = xor;
                              lodash.zip = zip;
                              lodash.zipObject = zipObject;
                              lodash.collect = map;
                              lodash.drop = rest;
                              lodash.each = forEach;
                              lodash.eachRight = forEachRight;
                              lodash.extend = assign;
                              lodash.methods = functions;
                              lodash.object = zipObject;
                              lodash.select = filter;
                              lodash.tail = rest;
                              lodash.unique = uniq;
                              lodash.unzip = zip;
                              mixin(lodash);
                              lodash.clone = clone;
                              lodash.cloneDeep = cloneDeep;
                              lodash.contains = contains;
                              lodash.escape = escape;
                              lodash.every = every;
                              lodash.find = find;
                              lodash.findIndex = findIndex;
                              lodash.findKey = findKey;
                              lodash.findLast = findLast;
                              lodash.findLastIndex = findLastIndex;
                              lodash.findLastKey = findLastKey;
                              lodash.has = has;
                              lodash.identity = identity;
                              lodash.indexOf = indexOf;
                              lodash.isArguments = isArguments;
                              lodash.isArray = isArray;
                              lodash.isBoolean = isBoolean;
                              lodash.isDate = isDate;
                              lodash.isElement = isElement;
                              lodash.isEmpty = isEmpty;
                              lodash.isEqual = isEqual;
                              lodash.isFinite = isFinite;
                              lodash.isFunction = isFunction;
                              lodash.isNaN = isNaN;
                              lodash.isNull = isNull;
                              lodash.isNumber = isNumber;
                              lodash.isObject = isObject;
                              lodash.isPlainObject = isPlainObject;
                              lodash.isRegExp = isRegExp;
                              lodash.isString = isString;
                              lodash.isUndefined = isUndefined;
                              lodash.lastIndexOf = lastIndexOf;
                              lodash.mixin = mixin;
                              lodash.noConflict = noConflict;
                              lodash.noop = noop;
                              lodash.now = now;
                              lodash.parseInt = parseInt;
                              lodash.random = random;
                              lodash.reduce = reduce;
                              lodash.reduceRight = reduceRight;
                              lodash.result = result;
                              lodash.runInContext = runInContext;
                              lodash.size = size;
                              lodash.some = some;
                              lodash.sortedIndex = sortedIndex;
                              lodash.template = template;
                              lodash.unescape = unescape;
                              lodash.uniqueId = uniqueId;
                              lodash.all = every;
                              lodash.any = some;
                              lodash.detect = find;
                              lodash.findWhere = find;
                              lodash.foldl = reduce;
                              lodash.foldr = reduceRight;
                              lodash.include = contains;
                              lodash.inject = reduce;
                              mixin(
                                  (function () {
                                      var source = {};
                                      forOwn(lodash, function (func, methodName) {
                                          if (!lodash.prototype[methodName]) {
                                              source[methodName] = func;
                                          }
                                      });
                                      return source;
                                  })(),
                                  false
                              );
                              lodash.first = first;
                              lodash.last = last;
                              lodash.sample = sample;
                              lodash.take = first;
                              lodash.head = first;
                              forOwn(lodash, function (func, methodName) {
                                  var callbackable = methodName !== "sample";
                                  if (!lodash.prototype[methodName]) {
                                      lodash.prototype[methodName] = function (n, guard) {
                                          var chainAll = this.__chain__,
                                              result = func(this.__wrapped__, n, guard);
                                          return !chainAll && (n == null || (guard && !(callbackable && typeof n == "function"))) ? result : new lodashWrapper(result, chainAll);
                                      };
                                  }
                              });
                              lodash.VERSION = "2.4.1";
                              lodash.prototype.chain = wrapperChain;
                              lodash.prototype.toString = wrapperToString;
                              lodash.prototype.value = wrapperValueOf;
                              lodash.prototype.valueOf = wrapperValueOf;
                              forEach(["join", "pop", "shift"], function (methodName) {
                                  var func = arrayRef[methodName];
                                  lodash.prototype[methodName] = function () {
                                      var chainAll = this.__chain__,
                                          result = func.apply(this.__wrapped__, arguments);
                                      return chainAll ? new lodashWrapper(result, chainAll) : result;
                                  };
                              });
                              forEach(["push", "reverse", "sort", "unshift"], function (methodName) {
                                  var func = arrayRef[methodName];
                                  lodash.prototype[methodName] = function () {
                                      func.apply(this.__wrapped__, arguments);
                                      return this;
                                  };
                              });
                              forEach(["concat", "slice", "splice"], function (methodName) {
                                  var func = arrayRef[methodName];
                                  lodash.prototype[methodName] = function () {
                                      return new lodashWrapper(func.apply(this.__wrapped__, arguments), this.__chain__);
                                  };
                              });
                              return lodash;
                          }
                          var _ = runInContext();
                          if (typeof define == "function" && typeof define.amd == "object" && define.amd) {
                              root._ = _;
                              define(function () {
                                  return _;
                              });
                          } else if (freeExports && freeModule) {
                              if (moduleExports) {
                                  (freeModule.exports = _)._ = _;
                              } else {
                                  freeExports._ = _;
                              }
                          } else {
                              root._ = _;
                          }
                      }.call(this));
                  }.call(this, typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {}));
              },
              {},
          ],
          14: [
              function (require, module, exports) {
                  (function (global, pool, math, width, chunks, digits, module, define, rngname) {
                      var startdenom = math.pow(width, chunks),
                          significance = math.pow(2, digits),
                          overflow = significance * 2,
                          mask = width - 1,
                          impl = (math["seed" + rngname] = function (seed, options, callback) {
                              var key = [];
                              options = options == true ? { entropy: true } : options || {};
                              var shortseed = mixkey(flatten(options.entropy ? [seed, tostring(pool)] : seed == null ? autoseed() : seed, 3), key);
                              var arc4 = new ARC4(key);
                              mixkey(tostring(arc4.S), pool);
                              return (
                                  options.pass ||
                                  callback ||
                                  function (prng, seed, is_math_call) {
                                      if (is_math_call) {
                                          math[rngname] = prng;
                                          return seed;
                                      } else return prng;
                                  }
                              )(
                                  function () {
                                      var n = arc4.g(chunks),
                                          d = startdenom,
                                          x = 0;
                                      while (n < significance) {
                                          n = (n + x) * width;
                                          d *= width;
                                          x = arc4.g(1);
                                      }
                                      while (n >= overflow) {
                                          n /= 2;
                                          d /= 2;
                                          x >>>= 1;
                                      }
                                      return (n + x) / d;
                                  },
                                  shortseed,
                                  "global" in options ? options.global : this == math
                              );
                          });
                      function ARC4(key) {
                          var t,
                              keylen = key.length,
                              me = this,
                              i = 0,
                              j = (me.i = me.j = 0),
                              s = (me.S = []);
                          if (!keylen) {
                              key = [keylen++];
                          }
                          while (i < width) {
                              s[i] = i++;
                          }
                          for (i = 0; i < width; i++) {
                              s[i] = s[(j = mask & (j + key[i % keylen] + (t = s[i])))];
                              s[j] = t;
                          }
                          (me.g = function (count) {
                              var t,
                                  r = 0,
                                  i = me.i,
                                  j = me.j,
                                  s = me.S;
                              while (count--) {
                                  t = s[(i = mask & (i + 1))];
                                  r = r * width + s[mask & ((s[i] = s[(j = mask & (j + t))]) + (s[j] = t))];
                              }
                              me.i = i;
                              me.j = j;
                              return r;
                          })(width);
                      }
                      function flatten(obj, depth) {
                          var result = [],
                              typ = typeof obj,
                              prop;
                          if (depth && typ == "object") {
                              for (prop in obj) {
                                  try {
                                      result.push(flatten(obj[prop], depth - 1));
                                  } catch (e) {}
                              }
                          }
                          return result.length ? result : typ == "string" ? obj : obj + "\x00";
                      }
                      function mixkey(seed, key) {
                          var stringseed = seed + "",
                              smear,
                              j = 0;
                          while (j < stringseed.length) {
                              key[mask & j] = mask & ((smear ^= key[mask & j] * 19) + stringseed.charCodeAt(j++));
                          }
                          return tostring(key);
                      }
                      function autoseed(seed) {
                          try {
                              global.crypto.getRandomValues((seed = new Uint8Array(width)));
                              return tostring(seed);
                          } catch (e) {
                              return [+new Date(), global, (seed = global.navigator) && seed.plugins, global.screen, tostring(pool)];
                          }
                      }
                      function tostring(a) {
                          return String.fromCharCode.apply(0, a);
                      }
                      mixkey(math[rngname](), pool);
                      if (module && module.exports) {
                          module.exports = impl;
                      } else if (define && define.amd) {
                          define(function () {
                              return impl;
                          });
                      }
                  })(this, [], Math, 256, 6, 52, typeof module == "object" && module, typeof define == "function" && define, "random");
              },
              {},
          ],
          15: [
              function (require, module, exports) {
                  (function () {
                      var F2 = 0.5 * (Math.sqrt(3) - 1),
                          G2 = (3 - Math.sqrt(3)) / 6,
                          F3 = 1 / 3,
                          G3 = 1 / 6,
                          F4 = (Math.sqrt(5) - 1) / 4,
                          G4 = (5 - Math.sqrt(5)) / 20;
                      function SimplexNoise(random) {
                          if (!random) random = Math.random;
                          this.p = new Uint8Array(256);
                          this.perm = new Uint8Array(512);
                          this.permMod12 = new Uint8Array(512);
                          for (var i = 0; i < 256; i++) {
                              this.p[i] = random() * 256;
                          }
                          for (i = 0; i < 512; i++) {
                              this.perm[i] = this.p[i & 255];
                              this.permMod12[i] = this.perm[i] % 12;
                          }
                      }
                      SimplexNoise.prototype = {
                          grad3: new Float32Array([1, 1, 0, -1, 1, 0, 1, -1, 0, -1, -1, 0, 1, 0, 1, -1, 0, 1, 1, 0, -1, -1, 0, -1, 0, 1, 1, 0, -1, 1, 0, 1, -1, 0, -1, -1]),
                          grad4: new Float32Array([
                              0,
                              1,
                              1,
                              1,
                              0,
                              1,
                              1,
                              -1,
                              0,
                              1,
                              -1,
                              1,
                              0,
                              1,
                              -1,
                              -1,
                              0,
                              -1,
                              1,
                              1,
                              0,
                              -1,
                              1,
                              -1,
                              0,
                              -1,
                              -1,
                              1,
                              0,
                              -1,
                              -1,
                              -1,
                              1,
                              0,
                              1,
                              1,
                              1,
                              0,
                              1,
                              -1,
                              1,
                              0,
                              -1,
                              1,
                              1,
                              0,
                              -1,
                              -1,
                              -1,
                              0,
                              1,
                              1,
                              -1,
                              0,
                              1,
                              -1,
                              -1,
                              0,
                              -1,
                              1,
                              -1,
                              0,
                              -1,
                              -1,
                              1,
                              1,
                              0,
                              1,
                              1,
                              1,
                              0,
                              -1,
                              1,
                              -1,
                              0,
                              1,
                              1,
                              -1,
                              0,
                              -1,
                              -1,
                              1,
                              0,
                              1,
                              -1,
                              1,
                              0,
                              -1,
                              -1,
                              -1,
                              0,
                              1,
                              -1,
                              -1,
                              0,
                              -1,
                              1,
                              1,
                              1,
                              0,
                              1,
                              1,
                              -1,
                              0,
                              1,
                              -1,
                              1,
                              0,
                              1,
                              -1,
                              -1,
                              0,
                              -1,
                              1,
                              1,
                              0,
                              -1,
                              1,
                              -1,
                              0,
                              -1,
                              -1,
                              1,
                              0,
                              -1,
                              -1,
                              -1,
                              0,
                          ]),
                          noise2D: function (xin, yin) {
                              var permMod12 = this.permMod12,
                                  perm = this.perm,
                                  grad3 = this.grad3;
                              var n0, n1, n2;
                              var s = (xin + yin) * F2;
                              var i = Math.floor(xin + s);
                              var j = Math.floor(yin + s);
                              var t = (i + j) * G2;
                              var X0 = i - t;
                              var Y0 = j - t;
                              var x0 = xin - X0;
                              var y0 = yin - Y0;
                              var i1, j1;
                              if (x0 > y0) {
                                  i1 = 1;
                                  j1 = 0;
                              } else {
                                  i1 = 0;
                                  j1 = 1;
                              }
                              var x1 = x0 - i1 + G2;
                              var y1 = y0 - j1 + G2;
                              var x2 = x0 - 1 + 2 * G2;
                              var y2 = y0 - 1 + 2 * G2;
                              var ii = i & 255;
                              var jj = j & 255;
                              var t0 = 0.5 - x0 * x0 - y0 * y0;
                              if (t0 < 0) n0 = 0;
                              else {
                                  var gi0 = permMod12[ii + perm[jj]] * 3;
                                  t0 *= t0;
                                  n0 = t0 * t0 * (grad3[gi0] * x0 + grad3[gi0 + 1] * y0);
                              }
                              var t1 = 0.5 - x1 * x1 - y1 * y1;
                              if (t1 < 0) n1 = 0;
                              else {
                                  var gi1 = permMod12[ii + i1 + perm[jj + j1]] * 3;
                                  t1 *= t1;
                                  n1 = t1 * t1 * (grad3[gi1] * x1 + grad3[gi1 + 1] * y1);
                              }
                              var t2 = 0.5 - x2 * x2 - y2 * y2;
                              if (t2 < 0) n2 = 0;
                              else {
                                  var gi2 = permMod12[ii + 1 + perm[jj + 1]] * 3;
                                  t2 *= t2;
                                  n2 = t2 * t2 * (grad3[gi2] * x2 + grad3[gi2 + 1] * y2);
                              }
                              return 70 * (n0 + n1 + n2);
                          },
                          noise3D: function (xin, yin, zin) {
                              var permMod12 = this.permMod12,
                                  perm = this.perm,
                                  grad3 = this.grad3;
                              var n0, n1, n2, n3;
                              var s = (xin + yin + zin) * F3;
                              var i = Math.floor(xin + s);
                              var j = Math.floor(yin + s);
                              var k = Math.floor(zin + s);
                              var t = (i + j + k) * G3;
                              var X0 = i - t;
                              var Y0 = j - t;
                              var Z0 = k - t;
                              var x0 = xin - X0;
                              var y0 = yin - Y0;
                              var z0 = zin - Z0;
                              var i1, j1, k1;
                              var i2, j2, k2;
                              if (x0 >= y0) {
                                  if (y0 >= z0) {
                                      i1 = 1;
                                      j1 = 0;
                                      k1 = 0;
                                      i2 = 1;
                                      j2 = 1;
                                      k2 = 0;
                                  } else if (x0 >= z0) {
                                      i1 = 1;
                                      j1 = 0;
                                      k1 = 0;
                                      i2 = 1;
                                      j2 = 0;
                                      k2 = 1;
                                  } else {
                                      i1 = 0;
                                      j1 = 0;
                                      k1 = 1;
                                      i2 = 1;
                                      j2 = 0;
                                      k2 = 1;
                                  }
                              } else {
                                  if (y0 < z0) {
                                      i1 = 0;
                                      j1 = 0;
                                      k1 = 1;
                                      i2 = 0;
                                      j2 = 1;
                                      k2 = 1;
                                  } else if (x0 < z0) {
                                      i1 = 0;
                                      j1 = 1;
                                      k1 = 0;
                                      i2 = 0;
                                      j2 = 1;
                                      k2 = 1;
                                  } else {
                                      i1 = 0;
                                      j1 = 1;
                                      k1 = 0;
                                      i2 = 1;
                                      j2 = 1;
                                      k2 = 0;
                                  }
                              }
                              var x1 = x0 - i1 + G3;
                              var y1 = y0 - j1 + G3;
                              var z1 = z0 - k1 + G3;
                              var x2 = x0 - i2 + 2 * G3;
                              var y2 = y0 - j2 + 2 * G3;
                              var z2 = z0 - k2 + 2 * G3;
                              var x3 = x0 - 1 + 3 * G3;
                              var y3 = y0 - 1 + 3 * G3;
                              var z3 = z0 - 1 + 3 * G3;
                              var ii = i & 255;
                              var jj = j & 255;
                              var kk = k & 255;
                              var t0 = 0.6 - x0 * x0 - y0 * y0 - z0 * z0;
                              if (t0 < 0) n0 = 0;
                              else {
                                  var gi0 = permMod12[ii + perm[jj + perm[kk]]] * 3;
                                  t0 *= t0;
                                  n0 = t0 * t0 * (grad3[gi0] * x0 + grad3[gi0 + 1] * y0 + grad3[gi0 + 2] * z0);
                              }
                              var t1 = 0.6 - x1 * x1 - y1 * y1 - z1 * z1;
                              if (t1 < 0) n1 = 0;
                              else {
                                  var gi1 = permMod12[ii + i1 + perm[jj + j1 + perm[kk + k1]]] * 3;
                                  t1 *= t1;
                                  n1 = t1 * t1 * (grad3[gi1] * x1 + grad3[gi1 + 1] * y1 + grad3[gi1 + 2] * z1);
                              }
                              var t2 = 0.6 - x2 * x2 - y2 * y2 - z2 * z2;
                              if (t2 < 0) n2 = 0;
                              else {
                                  var gi2 = permMod12[ii + i2 + perm[jj + j2 + perm[kk + k2]]] * 3;
                                  t2 *= t2;
                                  n2 = t2 * t2 * (grad3[gi2] * x2 + grad3[gi2 + 1] * y2 + grad3[gi2 + 2] * z2);
                              }
                              var t3 = 0.6 - x3 * x3 - y3 * y3 - z3 * z3;
                              if (t3 < 0) n3 = 0;
                              else {
                                  var gi3 = permMod12[ii + 1 + perm[jj + 1 + perm[kk + 1]]] * 3;
                                  t3 *= t3;
                                  n3 = t3 * t3 * (grad3[gi3] * x3 + grad3[gi3 + 1] * y3 + grad3[gi3 + 2] * z3);
                              }
                              return 32 * (n0 + n1 + n2 + n3);
                          },
                          noise4D: function (x, y, z, w) {
                              var permMod12 = this.permMod12,
                                  perm = this.perm,
                                  grad4 = this.grad4;
                              var n0, n1, n2, n3, n4;
                              var s = (x + y + z + w) * F4;
                              var i = Math.floor(x + s);
                              var j = Math.floor(y + s);
                              var k = Math.floor(z + s);
                              var l = Math.floor(w + s);
                              var t = (i + j + k + l) * G4;
                              var X0 = i - t;
                              var Y0 = j - t;
                              var Z0 = k - t;
                              var W0 = l - t;
                              var x0 = x - X0;
                              var y0 = y - Y0;
                              var z0 = z - Z0;
                              var w0 = w - W0;
                              var rankx = 0;
                              var ranky = 0;
                              var rankz = 0;
                              var rankw = 0;
                              if (x0 > y0) rankx++;
                              else ranky++;
                              if (x0 > z0) rankx++;
                              else rankz++;
                              if (x0 > w0) rankx++;
                              else rankw++;
                              if (y0 > z0) ranky++;
                              else rankz++;
                              if (y0 > w0) ranky++;
                              else rankw++;
                              if (z0 > w0) rankz++;
                              else rankw++;
                              var i1, j1, k1, l1;
                              var i2, j2, k2, l2;
                              var i3, j3, k3, l3;
                              i1 = rankx >= 3 ? 1 : 0;
                              j1 = ranky >= 3 ? 1 : 0;
                              k1 = rankz >= 3 ? 1 : 0;
                              l1 = rankw >= 3 ? 1 : 0;
                              i2 = rankx >= 2 ? 1 : 0;
                              j2 = ranky >= 2 ? 1 : 0;
                              k2 = rankz >= 2 ? 1 : 0;
                              l2 = rankw >= 2 ? 1 : 0;
                              i3 = rankx >= 1 ? 1 : 0;
                              j3 = ranky >= 1 ? 1 : 0;
                              k3 = rankz >= 1 ? 1 : 0;
                              l3 = rankw >= 1 ? 1 : 0;
                              var x1 = x0 - i1 + G4;
                              var y1 = y0 - j1 + G4;
                              var z1 = z0 - k1 + G4;
                              var w1 = w0 - l1 + G4;
                              var x2 = x0 - i2 + 2 * G4;
                              var y2 = y0 - j2 + 2 * G4;
                              var z2 = z0 - k2 + 2 * G4;
                              var w2 = w0 - l2 + 2 * G4;
                              var x3 = x0 - i3 + 3 * G4;
                              var y3 = y0 - j3 + 3 * G4;
                              var z3 = z0 - k3 + 3 * G4;
                              var w3 = w0 - l3 + 3 * G4;
                              var x4 = x0 - 1 + 4 * G4;
                              var y4 = y0 - 1 + 4 * G4;
                              var z4 = z0 - 1 + 4 * G4;
                              var w4 = w0 - 1 + 4 * G4;
                              var ii = i & 255;
                              var jj = j & 255;
                              var kk = k & 255;
                              var ll = l & 255;
                              var t0 = 0.6 - x0 * x0 - y0 * y0 - z0 * z0 - w0 * w0;
                              if (t0 < 0) n0 = 0;
                              else {
                                  var gi0 = (perm[ii + perm[jj + perm[kk + perm[ll]]]] % 32) * 4;
                                  t0 *= t0;
                                  n0 = t0 * t0 * (grad4[gi0] * x0 + grad4[gi0 + 1] * y0 + grad4[gi0 + 2] * z0 + grad4[gi0 + 3] * w0);
                              }
                              var t1 = 0.6 - x1 * x1 - y1 * y1 - z1 * z1 - w1 * w1;
                              if (t1 < 0) n1 = 0;
                              else {
                                  var gi1 = (perm[ii + i1 + perm[jj + j1 + perm[kk + k1 + perm[ll + l1]]]] % 32) * 4;
                                  t1 *= t1;
                                  n1 = t1 * t1 * (grad4[gi1] * x1 + grad4[gi1 + 1] * y1 + grad4[gi1 + 2] * z1 + grad4[gi1 + 3] * w1);
                              }
                              var t2 = 0.6 - x2 * x2 - y2 * y2 - z2 * z2 - w2 * w2;
                              if (t2 < 0) n2 = 0;
                              else {
                                  var gi2 = (perm[ii + i2 + perm[jj + j2 + perm[kk + k2 + perm[ll + l2]]]] % 32) * 4;
                                  t2 *= t2;
                                  n2 = t2 * t2 * (grad4[gi2] * x2 + grad4[gi2 + 1] * y2 + grad4[gi2 + 2] * z2 + grad4[gi2 + 3] * w2);
                              }
                              var t3 = 0.6 - x3 * x3 - y3 * y3 - z3 * z3 - w3 * w3;
                              if (t3 < 0) n3 = 0;
                              else {
                                  var gi3 = (perm[ii + i3 + perm[jj + j3 + perm[kk + k3 + perm[ll + l3]]]] % 32) * 4;
                                  t3 *= t3;
                                  n3 = t3 * t3 * (grad4[gi3] * x3 + grad4[gi3 + 1] * y3 + grad4[gi3 + 2] * z3 + grad4[gi3 + 3] * w3);
                              }
                              var t4 = 0.6 - x4 * x4 - y4 * y4 - z4 * z4 - w4 * w4;
                              if (t4 < 0) n4 = 0;
                              else {
                                  var gi4 = (perm[ii + 1 + perm[jj + 1 + perm[kk + 1 + perm[ll + 1]]]] % 32) * 4;
                                  t4 *= t4;
                                  n4 = t4 * t4 * (grad4[gi4] * x4 + grad4[gi4 + 1] * y4 + grad4[gi4 + 2] * z4 + grad4[gi4 + 3] * w4);
                              }
                              return 27 * (n0 + n1 + n2 + n3 + n4);
                          },
                      };
                      if (typeof define !== "undefined" && define.amd)
                          define(function () {
                              return SimplexNoise;
                          });
                      else if (typeof window !== "undefined") window.SimplexNoise = SimplexNoise;
                      if (typeof exports !== "undefined") exports.SimplexNoise = SimplexNoise;
                      if (typeof module !== "undefined") {
                          module.exports = SimplexNoise;
                      }
                  })();
              },
              {},
          ],
          17: [
              function (require, module, exports) {
                  module.exports = Emitter;
                  function Emitter(obj) {
                      if (obj) return mixin(obj);
                  }
                  function mixin(obj) {
                      for (var key in Emitter.prototype) {
                          obj[key] = Emitter.prototype[key];
                      }
                      return obj;
                  }
                  Emitter.prototype.on = Emitter.prototype.addEventListener = function (event, fn) {
                      this._callbacks = this._callbacks || {};
                      (this._callbacks[event] = this._callbacks[event] || []).push(fn);
                      return this;
                  };
                  Emitter.prototype.once = function (event, fn) {
                      var self = this;
                      this._callbacks = this._callbacks || {};
                      function on() {
                          self.off(event, on);
                          fn.apply(this, arguments);
                      }
                      on.fn = fn;
                      this.on(event, on);
                      return this;
                  };
                  Emitter.prototype.off = Emitter.prototype.removeListener = Emitter.prototype.removeAllListeners = Emitter.prototype.removeEventListener = function (event, fn) {
                      this._callbacks = this._callbacks || {};
                      if (0 == arguments.length) {
                          this._callbacks = {};
                          return this;
                      }
                      var callbacks = this._callbacks[event];
                      if (!callbacks) return this;
                      if (1 == arguments.length) {
                          delete this._callbacks[event];
                          return this;
                      }
                      var cb;
                      for (var i = 0; i < callbacks.length; i++) {
                          cb = callbacks[i];
                          if (cb === fn || cb.fn === fn) {
                              callbacks.splice(i, 1);
                              break;
                          }
                      }
                      return this;
                  };
                  Emitter.prototype.emit = function (event) {
                      this._callbacks = this._callbacks || {};
                      var args = [].slice.call(arguments, 1),
                          callbacks = this._callbacks[event];
                      if (callbacks) {
                          callbacks = callbacks.slice(0);
                          for (var i = 0, len = callbacks.length; i < len; ++i) {
                              callbacks[i].apply(this, args);
                          }
                      }
                      return this;
                  };
                  Emitter.prototype.listeners = function (event) {
                      this._callbacks = this._callbacks || {};
                      return this._callbacks[event] || [];
                  };
                  Emitter.prototype.hasListeners = function (event) {
                      return !!this.listeners(event).length;
                  };
              },
              {},
          ],
          18: [
              function (require, module, exports) {
                  module.exports = function (arr, fn, initial) {
                      var idx = 0;
                      var len = arr.length;
                      var curr = arguments.length == 3 ? initial : arr[idx++];
                      while (idx < len) {
                          curr = fn.call(null, curr, arr[idx], ++idx, arr);
                      }
                      return curr;
                  };
              },
              {},
          ],
      },
      {},
      [4]
  )(4);
});
