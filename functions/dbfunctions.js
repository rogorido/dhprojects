const path = require("path");
const pgp = require("pg-promise")(/* options */);
const db = pgp("postgres://igor@localhost:5432/dhprojects");

// Helper for linking to external query files:
function sql(file) {
  const fullPath = path.join(__dirname, file);
  return new pgp.QueryFile(fullPath, { minify: true });
}

const sqlGetCategories = sql("../sqls/categories.sql");
const sqlFindProjectsSimple = sql("../sqls/querysimple.sql");
const sqlFindProjectsComplex = sql("../sqls/querywithcats.sql");

async function getCategories(request, response) {
  const rowList = await db.query(sqlGetCategories);
  response.send(rowList);
}

async function getWorks(request, response) {
  let rowList = [];

  // there are no terms, only cats
  if (!request.query.term && request.query.cat) {
    let cats = Array.isArray(request.query.cat)
      ? request.query.cat.join(",")
      : request.query.cat;

    rowList = await db.query(sqlFindWorkPerCategory, cats);
  } else if (!request.query.cat && request.query.term) {
    let terms = Array.isArray(request.query.term)
      ? request.query.term.join(":*&")
      : request.query.term;

    // we need to add at the end :*
    terms = `${terms}:*`;
    rowList = await db.query(sqlFindWork, terms);
  } else {
    // terms and cats

    let cats = Array.isArray(request.query.cat)
      ? request.query.cat.join(",")
      : request.query.cat;

    let terms = Array.isArray(request.query.term)
      ? request.query.term.join(":*&")
      : request.query.term;

    // we need to add at the end :*
    terms = `${terms}:*`;

    let valuestopass = [terms, cats];

    rowList = await db.query(sqlFindWorkTermsCats, valuestopass);
  }
  response.send(rowList);
}

module.exports = { getCategories, getWorks };