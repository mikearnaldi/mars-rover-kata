import * as M from "@effect-ts/core/Effect/Managed"
import * as Ref from "@effect-ts/core/Effect/Ref"
import * as T from "@effect-ts/core/Effect"
import { pipe } from "@effect-ts/core/Function"
import { Has } from "@effect-ts/core/Has"
import {
    AppError,
    Obstacle,
    parseCommands,
    parseObstacles,
    parsePlanet,
    parseRover,
    Planet,
    renderTravelOutcome,
    Rover,
    travel,
} from "./domain";
import { Environment, readEnv } from "./environment";
import { Logger } from "./logger";
import { ReadFile, readFile } from "./readFile";
import {
    Console,
    readConsole,
    writeConsole,
} from "./console";

type App = T.Effect<
    Has<Console>
    & Has<Environment>
    & Has<Logger>
    & Has<ReadFile>
    , AppError, void>;

const prompt =
    "Please, enter commands for the Rover in 'F,B,R,L' format: ";

// TODO remove console.logs
const loop = (
    planet: Planet,
    obstacles: ReadonlyArray<Obstacle>,
    roverRef: Ref.Ref<Rover>,
) => T.gen(function*(_) {
    const logger = yield* _(Logger);

    const cmdsStr = yield* _(readConsole(prompt));
    const cmds = yield* _(parseCommands(cmdsStr));
    yield* _(logger.log(`Rover is executing commands: ${cmds}`));

    const rover = yield* _(Ref.get(roverRef));
    const outcome = travel(planet, rover, obstacles, cmds);
    yield* _(Ref.update(() => outcome.rover)(roverRef));
    yield* _(writeConsole(`Rover position: ${renderTravelOutcome(outcome)}`));

    return outcome;
});

export const app: App = pipe(
    T.genM(function*(_) {
        const env = yield* _(readEnv);
        const logger = yield* _(Logger);
        const { useConsole } = yield* _(Console);

        yield* _(writeConsole("Welcome to Mars, Rover!"));

        const [planetStr, roverStr] = yield* _(pipe(
            readFile(env.PLANET_FILE),
            T.zip(readFile(env.ROVER_FILE)),
        ));
        const planetTuple = planetStr.split("\n");
        if (planetTuple.length < 2) {
            yield* _(T.fail({ kind: "MissingPlanetDataError" as const }));
        }
        const planet = yield* _(T.fromEither(() => parsePlanet(planetTuple[0])));
        yield* _(logger.log("Planet", planet));
        const obstacles = yield* _(T.fromEither(() => parseObstacles(planetTuple[1])));
        yield* _(logger.log("Obstacles", obstacles));
        const rover = yield* _(T.fromEither(() => parseRover(roverStr)));
        yield* _(logger.log("Rover", rover));
        const roverRef = yield* _(Ref.makeRef(rover))

        return yield* _(pipe(
            loop(planet, obstacles, roverRef),
            T.forever,
            useConsole,
        ));
    }),
);
