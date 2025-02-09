import * as A from "@effect-ts/core/Collections/Immutable/Array"
import * as HM from "@effect-ts/core/Collections/Mutable/HashMap"
import * as L from "@effect-ts/core/Effect/Layer"
import * as T from "@effect-ts/core/Effect"
import { provideTestClock, TestClock } from "@effect-ts/system/Clock"
import * as Ex from "@effect-ts/system/Exit"
import * as Ca from "@effect-ts/system/Cause"
import * as E from "@effect-ts/core/Either"
import { pipe } from "@effect-ts/core/Function"
import {
  Cmd,
  InitialPositionError,
  Obstacle,
  Orientation,
  Planet,
  ReadFileError,
  Rover,
  TravelOutcome,
  mkPlanet,
  mkRover,
  move,
  moveBackward,
  moveForward,
  parseCommand,
  parseCommands,
  parseObstacle,
  parseObstacles,
  parseOrientation,
  parsePlanet,
  parseRover,
  parseRoverClassic,
  parseRoverDo,
  parseRoverGen,
  renderNav,
  renderPlanet,
  renderTravelOutcome,
  travel,
  turnLeft,
  turnRight,
} from "../src/sol09/domain";
import { app, guardInitialPosition } from "../src/sol09/app";
import { Environment } from "../src/sol09/environment";
import { ReadFileLive, readFile } from "../src/sol09/readFile";
import {
  ConsoleRenderer,
  ConsoleRendererLive,
  render,
} from "../src/sol09/consoleRenderer";
import { EmptyColourPaletteServiceLive } from "../src/sol09/colourPalette";
import {
  TestConsole,
  TestLogger,
  TestReadFile,
} from "./utils";

let testLogger = new TestLogger();
let testConsole = new TestConsole();
let testReadFile = new TestReadFile();

beforeEach(() => {
  testLogger = new TestLogger();
  testConsole = new TestConsole();
});

describe("Mars Kata", () => {
  describe("Sol01", () => {
    describe("mkPlanet", () => {
      it("should create the planet given correct size", async () => {
        const w = 3;
        const h = 4;
        const mars = mkPlanet(w, h);
        expect(mars).toStrictEqual(E.right({ width: w, height: h }));
      });
      it("should return error given incorrect size", async () => {
        const w = 0;
        const h = -3;
        const mars = mkPlanet(w, h);
        expect(mars).toStrictEqual(E.left({
          kind: "PlanetConstructionError",
          msg: "width and height must be positive numbers!",
        }));
      });
    });
    describe("mkRover", () => {
      it("should create the rover given correct coordinates", async () => {
        const x = 1;
        const y = 2;
        const dir = Orientation.N;
        const rover = mkRover(x, y, dir);
        expect(rover).toStrictEqual(E.right({ x, y, orientation: dir }));
      });
      it("should return error given incorrect coordinates", async () => {
        const x = -1;
        const y = -2;
        const dir = Orientation.N;
        const rover = mkRover(x, y, dir);
        expect(rover).toStrictEqual(E.left({
          kind: "RoverCosntructionError",
          msg: "Coordinates must not be negative numbers"
        }));
      });
    });
    describe("turnLeft", () => {
      const x = 1;
      const y = 1;
      it("should head W if given N", async () => {
        const dir = Orientation.N;
        const rover: Rover = { x, y, orientation: dir };
        const result = turnLeft(rover);
        expect(result.x).toBe(x);
        expect(result.y).toBe(y);
        expect(result.orientation).toBe(Orientation.W);
      });
      it("should head S if given W", async () => {
        const dir = Orientation.W;
        const rover: Rover = { x, y, orientation: dir };
        const result = turnLeft(rover);
        expect(result.x).toBe(x);
        expect(result.y).toBe(y);
        expect(result.orientation).toBe(Orientation.S);
      });
      it("should head E if given S", async () => {
        const dir = Orientation.S;
        const rover: Rover = { x, y, orientation: dir };
        const result = turnLeft(rover);
        expect(result.x).toBe(x);
        expect(result.y).toBe(y);
        expect(result.orientation).toBe(Orientation.E);
      });
      it("should head N if given E", async () => {
        const dir = Orientation.E;
        const rover: Rover = { x, y, orientation: dir };
        const result = turnLeft(rover);
        expect(result.x).toBe(x);
        expect(result.y).toBe(y);
        expect(result.orientation).toBe(Orientation.N);
      });
    });
    describe("turnRight", () => {
      const x = 1;
      const y = 1;
      it("should head E if given N", async () => {
        const dir = Orientation.N;
        const rover: Rover = { x, y, orientation: dir };
        const result = turnRight(rover);
        expect(result.x).toBe(x);
        expect(result.y).toBe(y);
        expect(result.orientation).toBe(Orientation.E);
      });
      it("should head S if given E", async () => {
        const dir = Orientation.E;
        const rover: Rover = { x, y, orientation: dir };
        const result = turnRight(rover);
        expect(result.x).toBe(x);
        expect(result.y).toBe(y);
        expect(result.orientation).toBe(Orientation.S);
      });
      it("should head W if given S", async () => {
        const dir = Orientation.S;
        const rover: Rover = { x, y, orientation: dir };
        const result = turnRight(rover);
        expect(result.x).toBe(x);
        expect(result.y).toBe(y);
        expect(result.orientation).toBe(Orientation.W);
      });
      it("should head N if given W", async () => {
        const dir = Orientation.W;
        const rover: Rover = { x, y, orientation: dir };
        const result = turnRight(rover);
        expect(result.x).toBe(x);
        expect(result.y).toBe(y);
        expect(result.orientation).toBe(Orientation.N);
      });
    });
    describe("moveForward", () => {
      const mars: Planet = { width: 3, height: 4 };
      const x = 1;
      const y = 1;
      it("should move forward in N dir", async () => {
        const dir = Orientation.N;
        const rover: Rover = { x, y, orientation: dir };
        const result = moveForward(mars, rover);
        expect(result.x).toBe(x);
        expect(result.y).toBe(y + 1);
        expect(result.orientation).toBe(dir);
      });
      it("should move forward in E dir", async () => {
        const dir = Orientation.E;
        const rover: Rover = { x, y, orientation: dir };
        const result = moveForward(mars, rover);
        expect(result.x).toBe(x + 1);
        expect(result.y).toBe(y);
        expect(result.orientation).toBe(dir);
      });
      it("should move forward in S dir", async () => {
        const dir = Orientation.S;
        const rover: Rover = { x, y, orientation: dir };
        const result = moveForward(mars, rover);
        expect(result.x).toBe(x);
        expect(result.y).toBe(y - 1);
        expect(result.orientation).toBe(dir);
      });
      it("should move forward in W dir", async () => {
        const dir = Orientation.W;
        const rover: Rover = { x, y, orientation: dir };
        const result = moveForward(mars, rover);
        expect(result.x).toBe(x - 1);
        expect(result.y).toBe(y);
        expect(result.orientation).toBe(dir);
      });
      it("should wrap when going in N dir", async () => {
        const dir = Orientation.N;
        const rover: Rover = { x, y: mars.height - 1, orientation: dir };
        const result = moveForward(mars, rover);
        expect(result.x).toBe(x);
        expect(result.y).toBe(0);
        expect(result.orientation).toBe(dir);
      });
      it("should wrap when going in E dir", async () => {
        const dir = Orientation.E;
        const rover: Rover = { x: mars.width - 1, y, orientation: dir };
        const result = moveForward(mars, rover);
        expect(result.x).toBe(0);
        expect(result.y).toBe(y);
        expect(result.orientation).toBe(dir);
      });
      it("should wrap when going in S dir", async () => {
        const dir = Orientation.S;
        const rover: Rover = { x, y: 0, orientation: dir };
        const result = moveForward(mars, rover);
        expect(result.x).toBe(x);
        expect(result.y).toBe(mars.height - 1);
        expect(result.orientation).toBe(dir);
      });
      it("should wrap when going in W dir", async () => {
        const dir = Orientation.W;
        const rover: Rover = { x: 0, y, orientation: dir };
        const result = moveForward(mars, rover);
        expect(result.x).toBe(mars.width - 1);
        expect(result.y).toBe(y);
        expect(result.orientation).toBe(dir);
      });
    });
    describe("moveBackward", () => {
      const mars: Planet = { width: 3, height: 4 };
      const x = 1;
      const y = 1;
      it("should move backward in N dir", async () => {
        const dir = Orientation.S;
        const rover: Rover = { x, y, orientation: dir };
        const result = moveBackward(mars, rover);
        expect(result.x).toBe(x);
        expect(result.y).toBe(y + 1);
        expect(result.orientation).toBe(dir);
      });
      it("should move backward in E dir", async () => {
        const dir = Orientation.W;
        const rover: Rover = { x, y, orientation: dir };
        const result = moveBackward(mars, rover);
        expect(result.x).toBe(x + 1);
        expect(result.y).toBe(y);
        expect(result.orientation).toBe(dir);
      });
      it("should move backward in S dir", async () => {
        const dir = Orientation.N;
        const rover: Rover = { x, y, orientation: dir };
        const result = moveBackward(mars, rover);
        expect(result.x).toBe(x);
        expect(result.y).toBe(y - 1);
        expect(result.orientation).toBe(dir);
      });
      it("should move backward in W dir", async () => {
        const dir = Orientation.E;
        const rover: Rover = { x, y, orientation: dir };
        const result = moveBackward(mars, rover);
        expect(result.x).toBe(x - 1);
        expect(result.y).toBe(y);
        expect(result.orientation).toBe(dir);
      });
      it("should wrap when going in N dir", async () => {
        const dir = Orientation.S;
        const rover: Rover = { x, y: mars.height - 1, orientation: dir };
        const result = moveBackward(mars, rover);
        expect(result.x).toBe(x);
        expect(result.y).toBe(0);
        expect(result.orientation).toBe(dir);
      });
      it("should wrap when going in E dir", async () => {
        const dir = Orientation.W;
        const rover: Rover = { x: mars.width - 1, y, orientation: dir };
        const result = moveBackward(mars, rover);
        expect(result.x).toBe(0);
        expect(result.y).toBe(y);
        expect(result.orientation).toBe(dir);
      });
      it("should wrap when going in S dir", async () => {
        const dir = Orientation.N;
        const rover: Rover = { x, y: 0, orientation: dir };
        const result = moveBackward(mars, rover);
        expect(result.x).toBe(x);
        expect(result.y).toBe(mars.height - 1);
        expect(result.orientation).toBe(dir);
      });
      it("should wrap when going in W dir", async () => {
        const dir = Orientation.E;
        const rover: Rover = { x: 0, y, orientation: dir };
        const result = moveBackward(mars, rover);
        expect(result.x).toBe(mars.width - 1);
        expect(result.y).toBe(y);
        expect(result.orientation).toBe(dir);
      });
    });
  });
  describe("Sol02", () => {
    describe("move", () => {
      const mars: Planet = { width: 3, height: 4 };
      const x = 1;
      const y = 1;
      const dir = Orientation.N;
      const rover: Rover = { x, y, orientation: dir };
      const obstacles: Array<Obstacle> =
        [{ pos: { x: 2, y: 1 } }, { pos: { x: 3, y: 3 } }];
      it("should go forward", async () => {
        const result = move(mars, rover, obstacles, Cmd.F);
        expect(result.kind).toBe("Normal");
        expect(result.rover.x).toBe(x);
        expect(result.rover.y).toBe(y + 1);
        expect(result.rover.orientation).toBe(dir);
      });
      it("should go backward", async () => {
        const result = move(mars, rover, obstacles, Cmd.B);
        expect(result.kind).toBe("Normal");
        expect(result.rover.x).toBe(x);
        expect(result.rover.y).toBe(y - 1);
        expect(result.rover.orientation).toBe(dir);
      });
      it("should turn left", async () => {
        const result = move(mars, rover, obstacles, Cmd.L);
        expect(result.kind).toBe("Normal");
        expect(result.rover.x).toBe(x);
        expect(result.rover.y).toBe(y);
        expect(result.rover.orientation).toBe(Orientation.W);
      });
      it("should turn right", async () => {
        const result = move(mars, rover, obstacles, Cmd.R);
        expect(result.kind).toBe("Normal");
        expect(result.rover.x).toBe(x);
        expect(result.rover.y).toBe(y);
        expect(result.rover.orientation).toBe(Orientation.E);
      });
      it("should not hit obstacle when going forward", async () => {
        const orientation = Orientation.E;
        const result = move(mars, { ...rover, orientation }, obstacles, Cmd.F);
        expect(result.kind).toBe("Hit");
        expect(result.rover.x).toBe(x);
        expect(result.rover.y).toBe(y);
        expect(result.rover.orientation).toBe(orientation);
      });
      it("should not hit obstacle when going backwards", async () => {
        const orientation = Orientation.W;
        const result = move(mars, { ...rover, orientation }, obstacles, Cmd.B);
        expect(result.kind).toBe("Hit");
        expect(result.rover.x).toBe(x);
        expect(result.rover.y).toBe(y);
        expect(result.rover.orientation).toBe(orientation);
      });
    });
    describe("travel", () => {
      const mars: Planet = { width: 3, height: 4 };
      const x = 1;
      const y = 1;
      const dir = Orientation.N;
      const rover: Rover = { x, y, orientation: dir };
      const obstacles: Array<Obstacle> =
        [{ pos: { x: 2, y: 1 } }, { pos: { x: 2, y: 3 } }];
      it("should finish travel when did not hit obstacle", async () => {
        const cmds: Array<Cmd> = [
          Cmd.F,
          Cmd.R,
          Cmd.F,
          Cmd.F,
          Cmd.F,
          Cmd.R,
          Cmd.F,
          Cmd.F,
          Cmd.L,
        ];
        const result = travel(mars, rover, obstacles, cmds);
        expect(result.kind).toBe("Normal");
        expect(result.rover.x).toBe(1);
        expect(result.rover.y).toBe(0);
        expect(result.rover.orientation).toBe(Orientation.E);
      });
      it("should abort travel when hit obstacle", async () => {
        const cmds: Array<Cmd> = [
          Cmd.F,
          Cmd.R,
          Cmd.F,
          Cmd.L,
          Cmd.F,
          Cmd.R,
          Cmd.F,
          Cmd.F,
          Cmd.L,
        ];
        const result = travel(mars, rover, obstacles, cmds);
        expect(result.kind).toBe("Hit");
        expect(result.rover.x).toBe(2);
        expect(result.rover.y).toBe(2);
        expect(result.rover.orientation).toBe(Orientation.N);
      });
    });
  });
  describe("Sol03", () => {
    const wrongInputStrErr = {
      error: {
        error: "WrongInputStringError",
        kind: "ParseNumPairError",
      },
      kind: "ParseObstacleError",
    };
    describe("parsePlanet", () => {
      it("should parse correct input", async () => {
        const result = parsePlanet("5x4");
        expect(result).toStrictEqual(E.right({ width: 5, height: 4 }));
      });
      it("should return error given incorrect input", async () => {
        const err = {
          kind: "ParsePlanetError",
          error: {
            kind: "ParseNumPairError",
            error: "WrongInputStringError"
          }
        };
        const result1 = parsePlanet("ax4");
        expect(result1).toStrictEqual(E.left(err));
        const result2 = parsePlanet("3xb");
        expect(result2).toStrictEqual(E.left(err));
        const result3 = parsePlanet("3y8");
        expect(result3).toStrictEqual(E.left(err));
        const result4 = parsePlanet("-3x8");
        expect(result4).toStrictEqual(E.left(err));
        const result5 = parsePlanet("3x-8");
        expect(result5).toStrictEqual(E.left(err));
      });
    });
    describe("parseObstacle", () => {
      it("should parse correct input", async () => {
        const result = parseObstacle("1,2");
        expect(result).toStrictEqual(E.right({ pos: { x: 1, y: 2 } }));
      });
      it("should return error given incorrect input", async () => {
        const result1 = parseObstacle(",2");
        expect(result1).toStrictEqual(E.left(wrongInputStrErr));
        const result2 = parseObstacle("3,");
        expect(result2).toStrictEqual(E.left(wrongInputStrErr));
        const result3 = parseObstacle("a,3");
        expect(result3).toStrictEqual(E.left(wrongInputStrErr));
        const result4 = parseObstacle("-2,3");
        expect(result4).toStrictEqual(E.left(wrongInputStrErr));
      });
    });
    describe("parseObstacles", () => {
      it("should parse correct input", async () => {
        const result = parseObstacles("1,2 0,0 3,4");
        expect(result).toStrictEqual(E.right([{ pos: { x: 1, y: 2 } }, { pos: { x: 0, y: 0 } }, { pos: { x: 3, y: 4 } }]));
      });
      it("should return error given incorrect input", async () => {
        const result1 = parseObstacles(",2 3,4");
        expect(result1).toStrictEqual(E.left([wrongInputStrErr]));
        const result2 = parseObstacles("3, 3, 3");
        expect(result2).toStrictEqual(E.left([wrongInputStrErr, wrongInputStrErr, wrongInputStrErr
        ]));
        const result3 = parseObstacles("a,3 4,3");
        expect(result3).toStrictEqual(E.left([wrongInputStrErr]));
        const result4 = parseObstacles("3,-3 4,3");
        expect(result4).toStrictEqual(E.left([wrongInputStrErr]));
      });
    });
    describe("parseOrientation", () => {
      it("should parse correct input", async () => {
        const n = parseOrientation("N");
        expect(n).toStrictEqual(E.right(Orientation.N));
        const e = parseOrientation("E");
        expect(e).toStrictEqual(E.right(Orientation.E));
        const s = parseOrientation("S");
        expect(s).toStrictEqual(E.right(Orientation.S));
        const w = parseOrientation("W");
        expect(w).toStrictEqual(E.right(Orientation.W));
      });
      it("should return error given incorrect input", async () => {
        const result1 = parseOrientation("A");
        expect(result1).toStrictEqual(E.left({
          kind: "ParseOrientationError",
          input: "A",
        }));
        const result2 = parseOrientation("3");
        expect(result2).toStrictEqual(E.left({
          kind: "ParseOrientationError",
          input: "3",
        }));
      });
    });
    describe("parseRover", () => {
      it("should parse correct input", async () => {
        const result = parseRover("1,2:W");
        expect(result).toStrictEqual(E.right({ x: 1, y: 2, orientation: Orientation.W }));
      });
      it("should return error given incorrect input", async () => {
        const result1 = parseRover("1,2W");
        expect(result1).toStrictEqual(E.left({
          kind: "ParseRoverError",
          error: {
            kind: "InputError"
          },
        }));
        const result2 = parseRover("1,2:A");
        expect(result2).toStrictEqual(E.left({
          kind: "ParseRoverError",
          error: {
            kind: "ParseOrientationError",
            input: "A",
          }
        }));
        const result3 = parseRover("1.2:A");
        expect(result3).toStrictEqual(E.left({
          kind: "ParseRoverError",
          error: {
            kind: "ParseNumPairError",
            error: "WrongInputStringError"
          }
        }));
      });
    });
    describe("parseRover benchmarks", () => {
      const n = 100000;
      const input = "1,2:W";
      it("parseRoverClassic", async () => {
        expect(pipe(
          A.replicate_(n, input),
          A.forEachF(E.Applicative)((x) => parseRoverClassic(x)),
          E.isRight,
        )).toBeTruthy();
      });
      it("parseRoverDo", async () => {
        expect(pipe(
          A.replicate_(n, input),
          A.forEachF(E.Applicative)((x) => parseRoverDo(x)),
          E.isRight,
        )).toBeTruthy();
      });
      it("parseRoverGen", async () => {
        expect(pipe(
          A.replicate_(n, input),
          A.forEachF(E.Applicative)((x) => parseRoverGen(x)),
          E.isRight,
        )).toBeTruthy();
      });
    });
    describe("renderTravelOutcome", () => {
      it("should return correct srting for the Normal outcome", async () => {
        const outcome: TravelOutcome = { kind: "Normal", rover: { x: 3, y: 8, orientation: Orientation.N } };
        const result = renderTravelOutcome(outcome);
        expect(result).toStrictEqual("3:8:N");
      });
      it("should return correct srting for the Hit outcome", async () => {
        const outcome: TravelOutcome = { kind: "Hit", rover: { x: 1, y: 7, orientation: Orientation.E } };
        const result = renderTravelOutcome(outcome);
        expect(result).toStrictEqual("O:1:7:E");
      });
    });
  });
  describe("Sol04", () => {
    describe("parseCommand", () => {
      it("properly parses forward cmd", async () => {
        const input = "F";
        const result = parseCommand(input);
        expect(result).toStrictEqual(E.right(Cmd.F));
      });
      it("properly parses backward cmd", async () => {
        const input = "B";
        const result = parseCommand(input);
        expect(result).toStrictEqual(E.right(Cmd.B));
      });
      it("properly parses turn left cmd", async () => {
        const input = "L";
        const result = parseCommand(input);
        expect(result).toStrictEqual(E.right(Cmd.L));
      });
      it("properly parses turn right cmd", async () => {
        const input = "R";
        const result = parseCommand(input);
        expect(result).toStrictEqual(E.right(Cmd.R));
      });
      it("returns error given invalid input", async () => {
        const input = "X";
        const result = parseCommand(input);
        expect(result).toEqual(E.left({ kind: "ParseCmdError", input }));
      });
    });
    describe("parseCommands", () => {
      it("properly parses a few commands", async () => {
        const input = "F,B,L,R,F";
        const expected = [Cmd.F, Cmd.B, Cmd.L, Cmd.R, Cmd.F];
        const result = parseCommands(input);
        expect(result).toStrictEqual(E.right(expected));
      });
      it("returns error when fails to parse commands", async () => {
        const input = "F,B,X,R,F";
        const result = parseCommands(input);
        expect(result).toEqual(E.left({
          kind: "ParseCommandsError",
          input,
          error: "X",
        }));
        const input2 = "F,BR,F";
        const result2 = parseCommands(input2);
        expect(result2).toEqual(E.left({
          kind: "ParseCommandsError",
          input: input2,
          error: "BR",
        }));
        const input3 = "F,B,";
        const result3 = parseCommands(input3);
        expect(result3).toEqual(E.left({
          kind: "ParseCommandsError",
          input: input3,
          error: "",
        }));
      });
    });
    describe("readFile", () => {
      it("properly reads existing file", async () => {

        const filename = "solIn.txt";
        const result = await pipe(
          T.gen(function*(_) {
            return yield* _(readFile(filename));
          }),
          T.provideLayer(ReadFileLive["<+<"](testLogger.Live)),
          T.runPromiseExit,
        );
        expect(result).toEqual(Ex.succeed("sol04 test 1 2 3"));
      });
      it("returns error when file does not exist", async () => {
        const filename = "solxx.txt";
        const result = await pipe(
          T.gen(function*(_) {
            return yield* _(readFile(filename));
          }),
          T.mapError((e) => e.filename),
          T.provideLayer(ReadFileLive["<+<"](testLogger.Live)),
          T.runPromiseExit,
        );
        expect(result).toEqual(Ex.fail(filename));
      });
    });
  });
  describe("Sol07", () => {
    describe("app", () => {
      it("make proper calls for happy path", async () => {
        const planetFile = "planet.txt";
        const roverFile = "rover.txt";
        const EnvironmentLive = L.pure(Environment)({
          _tag: "Environment",
          readEnv: T.succeed({
            PLANET_FILE: planetFile,
            ROVER_FILE: roverFile,
          })
        });
        HM.set_(testReadFile.files, planetFile, "5x4\n1,2 0,0 3,4");
        HM.set_(testReadFile.files, roverFile, "1,3:W");
        const expectedConsoleDeath = "Boom!";
        const cmds = "F,B,L,R,F";
        testConsole.readConsole
          .mockImplementationOnce((prompt: string) =>
            T.succeedWith(() => {
              testConsole.promptMock.push(prompt);
              return cmds;
            }))
          .mockImplementation((_prompt: string) => {
            // Simulate defect
            throw expectedConsoleDeath;
          });

        const result = await pipe(
          app,
          T.zipLeftPar(TestClock.advance(5)),
          provideTestClock,
          T.provideSomeLayer(
            EnvironmentLive["+++"](
              testLogger.Live)["+++"](
                testLogger.Live[">=>"](testReadFile.Live)["+++"](
                  testConsole.Live["+++"](
                    EmptyColourPaletteServiceLive[">=>"](ConsoleRendererLive))))),
          T.runPromiseExit,
        );

        Ex.assertsFailure(result);
        expect(result.cause).toStrictEqual(Ca.die(expectedConsoleDeath));
        expect(testConsole.consoleMock).toStrictEqual([
          "Welcome to Mars, Rover!\n",
          "  ^\n< W >\n  v",
          "     .#...\n     .O...\n     .....\n     O....",
          "\nRover position: 1:3:W",
          "  ^\n< W >\n  v",
          "     .#...\n     .O...\n     .....\n     O....",
          "\nRover position: 1:3:W",
          "  ^\n< W >\n  v",
            "     #....\n     .O...\n     .....\n     O....",
          "\nRover position: 0:3:W",
          "\nExecuting cmds: F",
          "  ^\n< W >\n  v",
          "     .#...\n     .O...\n     .....\n     O....",
          "\nRover position: 1:3:W",
          "\nExecuting cmds: F B",
          "  ^\n< S >\n  v",
          "     .#...\n     .O...\n     .....\n     O....",
          "\nRover position: 1:3:S",
          "\nExecuting cmds: F B L",
          "  ^\n< W >\n  v",
          "     .#...\n     .O...\n     .....\n     O....",
          "\nRover position: 1:3:W",
          "\nExecuting cmds: F B L R",
          "  ^\n< W >\n  v",
          "     #....\n     .O...\n     .....\n     O....",
          "\nRover position: 0:3:W",
          "\nExecuting cmds: F B L R F",
          "\nMission completed!",
        ]);
        expect(testConsole.promptMock).toStrictEqual(
          ["\nPlease, enter commands for the Rover in 'F,B,R,L' format: "]);
        expect(testLogger.log).toStrictEqual([
            ["Planet", { width: 5, height: 4 }],
            ["Obstacles", [{ pos: { x: 1, y: 2 } }, { pos: { x: 0, y: 0 } }, { pos: { x: 3, y: 4 } }]],
            ["Rover", { x: 1, y: 3, orientation: "W" }],
            ["Rover is executing commands: F,B,L,R,F"],
        ])
        expect(testLogger.error).toStrictEqual([]);
        expect(testLogger.warn).toStrictEqual([]);
        expect(testLogger.debug).toStrictEqual([]);
      });
      it("handles wrong planetFile error", async () => {
        const planetFile = "nope.txt";
        const EnvironmentLive = L.pure(Environment)({
          _tag: "Environment",
          readEnv: T.succeed({
            PLANET_FILE: planetFile,
            ROVER_FILE: "rover.txt",
          })
        });
        const readFileErr = (filename: string): ReadFileError => ({
          kind: "ReadFileError",
          filename,
          error: null,
        });
        testReadFile.readFileMock.mockImplementation((f: string) =>
          T.fail(readFileErr(f)),
        );
        testConsole.readConsole.mockImplementation((prompt: string) =>
          T.succeedWith(() => {
            testConsole.promptMock.push(prompt);
            return "";
          }));
        const expectedError = [
          "Error detected:",
          {
            error: null,
            filename: planetFile,
            kind: "ReadFileError",
          },
        ]
        const ConsoleRendererLiveMock = L.pure(ConsoleRenderer)({
          _tag: "ConsoleRenderer",
          render: jest.fn(),
        });

        const result = await pipe(
          app,
          T.provideSomeLayer(
            EnvironmentLive["+++"](
              testLogger.Live)["+++"](
                testLogger.Live[">=>"](testReadFile.Live)["+++"](
                  testConsole.Live["+++"](ConsoleRendererLiveMock)))),
          T.runPromiseExit,
        );

        expect(result).toStrictEqual(Ex.fail(readFileErr(planetFile)));
        expect(testConsole.consoleMock).toStrictEqual(["Welcome to Mars, Rover!\n"]);
        expect(testConsole.promptMock).toStrictEqual([]);
        expect(testLogger.log).toStrictEqual([]);
        expect(testLogger.error).toStrictEqual([expectedError]);
        expect(testLogger.debug).toStrictEqual([]);
        expect(testLogger.warn).toStrictEqual([]);
      });
    });
  });
  describe("Sol09", () => {
    describe("renderNav", () => {
      const mkRover = (orientation: Orientation) => ({
        x: 0,
        y: 3,
        orientation,
      });
      it("render normal Rover heading N", async () => {
        const rover = mkRover(Orientation.N);
        const str = renderNav({ kind: "Normal", rover, })
        expect(str.split("\n")).toStrictEqual([
          "  ^",
          "< N >",
          "  v",
        ]);
      });
      it("render normal Rover heading E", async () => {
        const rover = mkRover(Orientation.E);
        const str = renderNav({ kind: "Normal", rover, })
        expect(str.split("\n")).toStrictEqual([
          "  ^",
          "< E >",
          "  v",
        ]);
      });
      it("render normal Rover heading S", async () => {
        const rover = mkRover(Orientation.S);
        const str = renderNav({ kind: "Normal", rover, })
        expect(str.split("\n")).toStrictEqual([
          "  ^",
          "< S >",
          "  v",
        ]);
      });
      it("render normal Rover heading W", async () => {
        const rover = mkRover(Orientation.W);
        const str = renderNav({ kind: "Normal", rover, })
        expect(str.split("\n")).toStrictEqual([
          "  ^",
          "< W >",
          "  v",
        ]);
      });
      it("render hit Rover heading N", async () => {
        const rover = mkRover(Orientation.N);
        const str = renderNav({ kind: "Hit", rover, })
        expect(str.split("\n")).toStrictEqual([
          "  ^",
          "< N >",
          "  v",
        ]);
      });
      it("render hit Rover heading E", async () => {
        const rover = mkRover(Orientation.E);
        const str = renderNav({ kind: "Hit", rover, })
        expect(str.split("\n")).toStrictEqual([
          "  ^",
          "< E >",
          "  v",
        ]);
      });
      it("render hit Rover heading S", async () => {
        const rover = mkRover(Orientation.S);
        const str = renderNav({ kind: "Hit", rover, })
        expect(str.split("\n")).toStrictEqual([
          "  ^",
          "< S >",
          "  v",
        ]);
      });
      it("render hit Rover heading W", async () => {
        const rover = mkRover(Orientation.W);
        const str = renderNav({ kind: "Hit", rover, })
        expect(str.split("\n")).toStrictEqual([
          "  ^",
          "< W >",
          "  v",
        ]);
      });
    });
    describe("renderPlanet", () => {
      const rover: Rover = {
        x: 0,
        y: 3,
        orientation: Orientation.N,
      };
      const obstacles: ReadonlyArray<Obstacle> =
        [{ pos: { x: 2, y: 1 } }, { pos: { x: 1, y: 3 } }];
      const mars: Planet = { width: 3, height: 4 };
      it("renders rover with Normal outcome", async () => {
        const str =
          renderPlanet(mars, obstacles)({ kind: "Normal", rover, });
        expect(str.split("\n")).toStrictEqual([
          "#O.",
          "...",
          "..O",
          "...",
        ]);
      });
      it("renders rover with Hit outcome", async () => {
        const str =
          renderPlanet(mars, obstacles)({
            kind: "Hit",
            rover: { ...rover, orientation: Orientation.E }
          });
        expect(str.split("\n")).toStrictEqual([
          "#O.",
          "...",
          "..O",
          "...",
        ]);
      });
    });
    describe("ConsoleRenderer", () => {
      it("renders all elements properly", async () => {
        const mars: Planet = { width: 3, height: 4 };
        const x = 1;
        const y = 1;
        const dir = Orientation.N;
        const rover: Rover = { x, y, orientation: dir };
        const obstacles: Array<Obstacle> =
          [{ pos: { x: 2, y: 1 } }, { pos: { x: 0, y: 3 } }];

        const result = await pipe(
          render({ planet: mars, obstacles, outcome: { kind: "Normal", rover } }),
          T.provideSomeLayer(
            EmptyColourPaletteServiceLive[">=>"](
              ConsoleRendererLive)["+++"](
                testLogger.Live[">=>"](testConsole.Live))),
          T.runPromiseExit,
        );

        expect(result).toEqual(Ex.succeed(undefined));
        expect(testConsole.cursorTo.mock.calls.length).toBe(1);
        expect(testConsole.cursorTo.mock.calls[0]).toEqual([0, 2]);
        expect(testConsole.clearScreenDown.mock.calls.length).toBe(1);
        expect(testConsole.consoleMock).toStrictEqual([
          "  ^\n< N >\n  v",
          "     O..\n     ...\n     .#O\n     ...",
          "\nRover position: 1:1:N",
        ]);
        expect(testLogger.log).toStrictEqual([]);
        expect(testLogger.error).toStrictEqual([]);
        expect(testLogger.warn).toStrictEqual([]);
        expect(testLogger.debug).toStrictEqual([]);
      });
    })
    describe("guardInitialPosition", () => {
      const x = 1;
      const y = 1;
      const dir = Orientation.N;
      it("returns no error when no obstacles present", async () => {
        const rover: Rover = { x, y, orientation: dir };
        const obstacles: Array<Obstacle> = [];
        const result = await pipe(
          guardInitialPosition(obstacles, rover),
          T.runPromiseExit,
        );
        expect(result).toEqual(Ex.succeed(undefined));
      });
      it("returns error when rover stars on one of the obstacles", async () => {
        const rover: Rover = { x, y, orientation: dir };
        const obstacles: Array<Obstacle> =
          [{ pos: { x: 2, y: 1 } }, { pos: { x, y } }];
        expect(await pipe(
          guardInitialPosition(obstacles, rover),
          T.runPromiseExit,
        )).toEqual(Ex.fail(new InitialPositionError()));
      });
      it("returns no when rover starts on clear terrain", async () => {
        const rover: Rover = { x, y, orientation: dir };
        const obstacles: Array<Obstacle> =
          [{ pos: { x: 2, y: 1 } }, { pos: { x: x + 1, y } }];
        expect(await pipe(
          guardInitialPosition(obstacles, rover),
          T.runPromiseExit,
        )).toEqual(Ex.succeed(undefined));
      });
    });
  });
});
