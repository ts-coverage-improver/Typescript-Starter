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

function resetGreeterModule(documentMock?: any): TsGreeterExports {
    delete require.cache[require.resolve(GREETER_PATH)];
    if (documentMock) {
        (global as any).document = documentMock;
    } else {
        delete (global as any).document;
    }
    delete (global as any).tsGreeter;
    require(GREETER_PATH);
    return (global as any).tsGreeter;
}

function createDocumentStub() {
    return {
        body: {
            innerHTML: "",
        },
    };
}

describe("greeter.ts", () => {
    it("creates students with computed full names that greeter can use", () => {
        const greeterExports = resetGreeterModule(createDocumentStub());
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
        resetGreeterModule(documentMock);

        assert.equal(documentMock.body.innerHTML, "Hello, Jane User");
    });

    it("skips DOM writes gracefully when document is missing", () => {
        assert.doesNotThrow(() => {
            resetGreeterModule(undefined);
        });
        assert.equal((global as any).document, undefined);
    });
});
