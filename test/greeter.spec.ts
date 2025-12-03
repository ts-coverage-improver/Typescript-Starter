import { strict as assert } from "assert";
import * as path from "path";

declare const global: any;

const GREETER_PATH = path.resolve(__dirname, "../src/greeter.ts");

interface TsGreeterExports {
    Student: new (firstName: string, middleInitial: string, lastName: string) => {
        firstName: string;
        middleInitial: string;
        lastName: string;
        fullName: string;
    };
    greeter: (person: { firstName: string; lastName: string }) => string;
}

interface ResetOptions {
    document?: any;
    window?: any;
    self?: any;
}

function resetGreeterModule(options: ResetOptions = {}): TsGreeterExports {
    const greeterPath = require.resolve(GREETER_PATH);
    delete require.cache[greeterPath];

    const globalAny = global as any;
    delete globalAny.document;
    delete globalAny.window;
    delete globalAny.self;
    delete globalAny.tsGreeter;

    if (options.document !== undefined) {
        globalAny.document = options.document;
    }
    if (options.window !== undefined) {
        globalAny.window = options.window;
    }
    if (options.self !== undefined) {
        globalAny.self = options.self;
    }

    require(GREETER_PATH);

    return (globalAny.tsGreeter ||
        (globalAny.window && globalAny.window.tsGreeter) ||
        (globalAny.self && globalAny.self.tsGreeter)) as TsGreeterExports;
}

function createDocumentStub() {
    return {
        body: {
            innerHTML: "",
        },
    };
}

describe("greeter.ts", () => {
    afterEach(() => {
        delete (global as any).window;
        delete (global as any).self;
        delete (global as any).document;
        delete (global as any).tsGreeter;
    });

    it("creates students with computed full names that greeter can use", () => {
        const greeterExports = resetGreeterModule({ document: createDocumentStub() });
        const Student = greeterExports.Student;
        const person = new Student("Ada", "L.", "Lovelace");

        assert.equal(person.fullName, "Ada L. Lovelace");
        assert.equal(
            greeterExports.greeter({ firstName: person.firstName, lastName: person.lastName }),
            "Hello, Ada Lovelace"
        );
    });

    it("writes the default greeting to the DOM when document is present", () => {
        const documentMock = createDocumentStub();
        resetGreeterModule({ document: documentMock });

        assert.equal(documentMock.body.innerHTML, "Hello, Jane User");
    });

    it("skips DOM writes gracefully when document is missing", () => {
        assert.doesNotThrow(() => {
            resetGreeterModule();
        });
        assert.equal((global as any).document, undefined);
    });

    it("prefers the window object as the global scope when available", () => {
        const windowMock: any = {};
        const exports = resetGreeterModule({ window: windowMock });

        assert.equal(windowMock.tsGreeter, exports);
        assert.equal((global as any).tsGreeter, undefined);
    });

    it("falls back to self when window is not defined", () => {
        const selfMock: any = {};
        const exports = resetGreeterModule({ self: selfMock });

        assert.equal(selfMock.tsGreeter, exports);
        assert.equal((global as any).tsGreeter, undefined);
    });

    it("avoids DOM writes when document.body is missing", () => {
        const documentMock = {};
        assert.doesNotThrow(() => {
            resetGreeterModule({ document: documentMock });
        });
        assert.equal((documentMock as any).body, undefined);
    });

    it("returns undefined from getGlobalScope when no known globals exist", () => {
        const originalGlobal: any = global;
        const greeterPath = require.resolve(GREETER_PATH);
        const assignGlobal: (value: any) => void = new Function("value", "global = value;") as any;

        delete require.cache[greeterPath];
        delete originalGlobal.window;
        delete originalGlobal.self;
        delete originalGlobal.tsGreeter;

        assignGlobal(undefined);
        try {
            assert.doesNotThrow(() => require(GREETER_PATH));
        } finally {
            assignGlobal(originalGlobal);
            delete require.cache[greeterPath];
        }

        assert.equal(originalGlobal.tsGreeter, undefined);
    });
});
