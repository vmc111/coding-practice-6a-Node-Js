const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const app = express();
const dbPath = path.join(__dirname, "covid19India.db");
app.use(express.json());

// Initialize DataBase
let db = null;
const RunDB = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at https://localhost:3000");
    });
  } catch (error) {
    console.log(`D+Base Initialization Error: ${error.message}`);
  }
};
RunDB();

// GET STATES TABLE

app.get("/states/", async (request, response) => {
  const getQuery = `
    SELECT
        state_id AS stateId, 
        state_name AS stateName, 
        population
     FROM
      state;`;

  let states = await db.all(getQuery);
  response.send(states);
});

// Get state for StateId

app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;

  const getById = `
    SELECT
        state_id AS stateId, 
        state_name AS stateName, 
        population
     FROM
      state
      WHERE 
        state_id = ${stateId};`;
  try {
    let stateById = await db.get(getById);
    response.send(stateById);
  } catch (e) {
    console.log(e.message);
  }
});

// API 3

app.post("/districts/", async (request, response) => {
  const { districtName, stateId, cases, cured, active, deaths } = request.body;

  const addDistrictQuery = `
  INSERT INTO 
  district (district_name, state_id, cases, cured, active, deaths)
  VALUES ('${districtName}', ${stateId}, ${cases}, ${cured}, ${active}, ${deaths});`;

  await db.run(addDistrictQuery);
  response.send("District Successfully Added");
});

// API 4 GET BY DISTRICT_ID

app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;

  const districtByIdQuery = `
    SELECT 
    district_id AS districtId, 
    district_name AS districtName,
    state_id AS stateId, 
    cases, 
    cured, 
    active,
    deaths
    FROM district 
    WHERE district_id = ${districtId};`;

  let districtForId = await db.get(districtByIdQuery);
  response.send(districtForId);
});

// API 5 DELETE METHOD

app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;

  const deleteRowQuery = `
    DELETE 
    FROM district 
    WHERE 
        district_id = ${districtId};`;

  await db.run(deleteRowQuery);
  response.send("District Removed");
});

// API 6 PUT METHOD

app.put("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  //   console.log(request.body);
  const updateQuery = `
  UPDATE 
    district 
    SET 
        district_name = '${districtName}', 
        state_id = ${stateId}, 
        cases = ${cases}, 
        cured = ${cured}, 
        active = ${active}, 
        deaths = ${deaths}
    WHERE 
        district_id = ${districtId};`;

  await db.run(updateQuery);
  response.send("District Details Updated");
});

// API 7

app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;

  const getStatsQuery = `
  SELECT 
    SUM(cases) AS totalCases, 
    SUM(cured) AS totalCured, 
    SUM(active) AS totalActive, 
    SUM(cured) AS totalCured, 
    SUM(deaths) AS totalDeaths
    FROM district 
    WHERE state_id = ${stateId}
    GROUP BY state_id;`;

  let stats = await db.get(getStatsQuery);
  response.send(stats);
});

// API 8

app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;

  const crossTableQuery = `
    SELECT 
        state_name AS stateName
        FROM state INNER JOIN district 
        ON state.state_id = district.state_id 
        WHERE district.district_id = ${districtId};`;

  let stateName = await db.get(crossTableQuery);
  response.send(stateName);
});

module.exports = app;
