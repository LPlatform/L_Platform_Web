import { describe, expect, it } from "vitest";
import { CsvParseError, parseCsv, recordsFromCsv, requireHeaders } from "./csv";

describe("parseCsv", () => {
  it("parses quoted values, escaped quotes and CRLF line endings", () => {
    const parsed = parseCsv('name,note\r\n"Ada, Lovelace","Said ""hello"""\r\n');

    expect(parsed.headers).toEqual(["name", "note"]);
    expect(parsed.rows).toEqual([["Ada, Lovelace", 'Said "hello"']]);
  });

  it("strips a UTF-8 BOM and skips blank rows", () => {
    const parsed = parseCsv("\uFEFFfirst,last\n\nGrace,Hopper\n   \n");

    expect(parsed.headers).toEqual(["first", "last"]);
    expect(parsed.rows).toEqual([["Grace", "Hopper"]]);
  });

  it("pads short rows and trims trailing columns", () => {
    const parsed = parseCsv("a,b,c\n1,2\n3,4,5,6\n");

    expect(parsed.rows).toEqual([
      ["1", "2", ""],
      ["3", "4", "5"],
    ]);
  });

  it("rejects an unterminated quoted value", () => {
    expect(() => parseCsv('name\n"Ada\n')).toThrow(CsvParseError);
  });

  it("rejects an empty file", () => {
    expect(() => parseCsv("")).toThrow("The CSV file is empty.");
  });
});

describe("recordsFromCsv", () => {
  it("normalizes header names into record keys", () => {
    const records = recordsFromCsv(
      parseCsv("First Name,Last_Name ,Organization ID\nAda,Lovelace,ORG-2026-0001\n"),
    );

    expect(records).toEqual([
      { firstname: "Ada", lastname: "Lovelace", organizationid: "ORG-2026-0001" },
    ]);
  });
});

describe("requireHeaders", () => {
  it("accepts normalized required headers", () => {
    const parsed = parseCsv("Email Address,User Name\nada@example.edu,ada\n");

    expect(() =>
      requireHeaders(parsed, [
        { key: "emailaddress", label: "Email" },
        { key: "username", label: "Username" },
      ]),
    ).not.toThrow();
  });

  it("reports every missing required column", () => {
    const parsed = parseCsv("email\nada@example.edu\n");

    expect(() =>
      requireHeaders(parsed, [
        { key: "email", label: "Email" },
        { key: "firstname", label: "First name" },
      ]),
    ).toThrow("Missing required column: First name.");
  });
});
