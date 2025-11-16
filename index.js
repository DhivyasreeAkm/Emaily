const express = require("express");
const cors = require("cors");
const sql = require("mssql");
const bodyParser = require("body-parser");

const app = express();
app.use(cors({ origin: "*" }));  
app.use(bodyParser.json());

const config = {
  user: "sa",
  password: "password@123",
  database: "VotingDB",
  server: "127.0.0.1",
  port: 1433,
  options: {
    encrypt: false,
    trustServerCertificate: true,
  },
};

let pool;

// Connect to SQL Server
sql
  .connect(config)
  .then((p) => {
    pool = p;
    console.log("Connected to SQL Server!");
  })
  .catch((err) => console.error("SQL Connection Error:", err));

// INSERT or UPDATE API
app.post("/api/form", async (req, res) => {
  const {
    voterPhoneNumber,
    voterAge,
    voterSex,
    voterDistrict,
    voterPoliticalParty,
  } = req.body;

  const query = `
  INSERT INTO voting.formData 
      (voterPhoneNumber, voterAge, voterSex, voterDistrict, voterPoliticalParty)
    VALUES 
      (@voterPhoneNumber, @voterAge, @voterSex, @voterDistrict, @voterPoliticalParty);
`;

  try {
    await pool
      .request()
      .input("voterPhoneNumber", sql.VarChar, voterPhoneNumber)
      .input("voterAge", sql.Int, voterAge)
      .input("voterSex", sql.VarChar, voterSex)
      .input("voterDistrict", sql.VarChar, voterDistrict)
      .input("voterPoliticalParty", sql.VarChar, voterPoliticalParty)
      .query(query);

    res.json({ message: "Form data saved successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

app.get("/api/results", async (req, res) => {
  const { district } = req.query;

  let query = `SELECT
    d.voterDistrict,
    p.voterPoliticalParty,
    COUNT(originalTable.voterPoliticalParty) AS count,
    (SELECT COUNT(*) FROM voting.formData) AS totalRows
FROM
    (SELECT DISTINCT value AS voterDistrict FROM OPENJSON('["Ariyalur","Chengalpattu","Chennai","Coimbatore","Cuddalore","Dharmapuri","Dindigul","Erode","Kallakurichi","Kancheepuram","Karur","Krishnagiri","Madurai","Mayiladuthurai","Nagapattinam","Namakkal","Nilgiris","Perambalur","Pudukkottai","Ramanathapuram","Ranipet","Salem","Sivagangai","Tenkasi","Thanjavur","Theni","Thoothukudi (Tuticorin)","Tiruchirappalli","Tirunelveli","Tirupathur","Tiruppur","Tiruvallur","Tiruvannamalai","Tiruvarur","Vellore","Viluppuram","Virudhunagar","Kanyakumari"]')) AS d
CROSS JOIN
    (SELECT DISTINCT value AS voterPoliticalParty FROM OPENJSON('["DMK (Dravida Munnetra Kazhagam)","AIADMK (All India Anna Dravida Munnetra Kazhagam)","BJP (Bharatiya Janata Party)","INC (Indian National Congress)","PMK (Pattali Makkal Katchi)","DMDK (Desiya Murpokku Dravida Kazhagam)","NTK (Naam Tamilar Katchi)","MNM (Makkal Needhi Maiam)","TMMK (Tamil Nadu Muslim Munnetra Kazhagam)","VCK (Viduthalai Chiruthaigal Katchi)","CPI (Communist Party of India)","CPI(M) (Communist Party of India - Marxist)","AMMK (Amma Makkal Munnetra Kazhagam)","TMC(M) (Tamil Maanila Congress)","AIADMK (OPS / EPS factions, if split)","INDEPENDANT","NOTA"]')) AS p
LEFT JOIN voting.formData originalTable
    ON originalTable.voterDistrict = d.voterDistrict
    AND originalTable.voterPoliticalParty = p.voterPoliticalParty`;

  if (district) {
    query += ` WHERE d.voterDistrict = @district `;
  }

  query += `
    GROUP BY d.voterDistrict, p.voterPoliticalParty
ORDER BY d.voterDistrict, p.voterPoliticalParty`;

  try {
    const request = pool.request();
    if (district) {
      request.input("district", district);
    }
    const result = await request.query(query);
    res.json(result.recordset);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

app.listen(4999, () => console.log("Server running on port 4999"));
