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
    preserveExistingExports?: boolean;
}

function resetGreeterModule(options: ResetOptions = {}): TsGreeterExports {
    delete require.cache[require.resolve(GREETER_PATH)];
    const globalAny = global as any;

    delete globalAny.window;
    delete globalAny.self;
    delete globalAny.document;

    if (options.window !== undefined) {
        globalAny.window = options.window;
    }
    if (options.self !== undefined) {
        globalAny.self = options.self;
    }
    if (options.document !== undefined) {
        globalAny.document = options.document;
    }

    if (!options.preserveExistingExports) {
        delete globalAny.tsGreeter;
    }

    require(GREETER_PATH);

    const tsGreeterExports =
        (globalAny.window && globalAny.window.tsGreeter) ||
        (globalAny.self && globalAny.self.tsGreeter) ||
        globalAny.tsGreeter;

    if (!tsGreeterExports) {
        throw new Error("tsGreeter exports not found after loading module");
    }

    return tsGreeterExports;
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

    it("registers the greeter on the window scope when present", () => {
        const windowMock: any = {};
        const greeterExports = resetGreeterModule({ window: windowMock });

        assert.equal(windowMock.tsGreeter, greeterExports);
        assert.equal((global as any).tsGreeter, undefined);
        assert.equal(greeterExports.greeter({ firstName: "Grace", lastName: "Hopper" }), "Hello, Grace Hopper");
    });

    it("falls back to the self scope when window is unavailable", () => {
        const selfMock: any = {};
        const greeterExports = resetGreeterModule({ self: selfMock });

        assert.equal(selfMock.tsGreeter, greeterExports);
        assert.equal((global as any).tsGreeter, undefined);
        assert.equal(greeterExports.greeter({ firstName: "Linus", lastName: "Torvalds" }), "Hello, Linus Torvalds");
    });

    it("preserves an existing tsGreeter export without overriding it", () => {
        class DummyStudent {
            firstName: string;
            middleInitial: string;
            lastName: string;
            fullName: string;

            constructor(firstName: string, middleInitial: string, lastName: string) {
                this.firstName = firstName;
                this.middleInitial = middleInitial;
                this.lastName = lastName;
                this.fullName = `${firstName} ${middleInitial} ${lastName}`;
            }
        }

        const originalExports: TsGreeterExports = {
            Student: DummyStudent,
            greeter: (person: { firstName: string; lastName: string }) => "Hello, Existing",
        };

        (global as any).tsGreeter = originalExports;
        const greeterExports = resetGreeterModule({ preserveExistingExports: true });

        assert.equal(greeterExports, originalExports);
        assert.equal((global as any).tsGreeter.greeter({ firstName: "Jane", lastName: "User" }), "Hello, Existing");
    });
});
