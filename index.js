const Lead = require("./models/Lead.model");
const SalesAgent = require("./models/SalesAgent.model");
const Comment = require("./models/Comment.model");
const { initializeDB } = require("./db/db.connect");
const express = require("express");
const cors = require("cors");

const App = express();
App.use(express.json());
App.use(cors());

initializeDB();

/////////////////////////////////////////////////////////////////////////
const newLead = {
  name: "Tech Solutions Inc.",
  source: "Website",
  salesAgent: "68762bf24995ff89218cec41", // Alice Johnson
  status: "New",
  tags: ["High Value"],
  timeToClose: 30,
  priority: "High",
};

//function to add new lead
async function addNewLead(newLead) {
  try {
    const lead = new Lead(newLead);
    const savedLead = await lead.save();
    console.log("New lead create is: ", savedLead);
    return savedLead;
  } catch (error) {
    throw error;
  }
}
//addNewLead(newLead);

// POST route to add new Lead
App.post("/leads", async (req, res) => {
  const { name, source, salesAgent, status, tags, timeToClose, priority } =
    req.body;

  //validation for required fields
  const requiredFields = {
    name: "string",
    source: "string",
    salesAgent: "string",
    status: "string",
    priority: "string",
  };
  for (const fields in requiredFields) {
    if (
      !req.body[fields] ||
      typeof req.body[fields] !== requiredFields[fields]
    ) {
      return res.status(400).json({
        error: `Invalid input: ${fields} is required and it should be ${requiredFields[fields]}`,
      });
    }
  }

  try {
    const agent = await SalesAgent.findById(salesAgent);
    if (!agent || agent.length === 0) {
      return res.status(404).json({
        error: `Sales agent with ID ${salesAgent} not found.`,
      });
    }
    const savedLead = await addNewLead(req.body);
    res.status(201).json({ savedLead });
  } catch (error) {
    console.error("Error while saving lead:", error);
    return res.status(500).json({
      error: "An error occured while saving lead.",
    });
  }
});
//function to get all leads
async function readAllLeads(filter) {
  try {
    const allLeads = await Lead.find(filter).populate("salesAgent", "name");
    return allLeads;
  } catch (error) {
    console.log("An error occured while fetching leads.", error);
    throw error;
  }
}
//readAllLeads();
// GET route to fetch all Leads
App.get("/leads", async (req, res) => {
  const { salesAgent, status, tags, source, priority } = req.query;
  let filter = {};
  if (salesAgent) filter.salesAgent = salesAgent;
  if (status) filter.status = status;
  if (source) filter.source = source;
  if (priority) filter.priority = priority;

  if (tags) {
    const tagsArray = Array.isArray(tags)
      ? tags
      : tags.split(",").map((tag) => tag.trim());
    filter.tags = { $all: tagsArray };
  }

  try {
    const leads = await readAllLeads(filter);
    if (leads && leads.length > 0) {
      return res.status(200).json({ leads });
    } else {
      return res.status(404).json({
        error: "Leads not found.",
      });
    }
  } catch (error) {
    console.log("An error occured while fetching leads", error);
    return res.status(500).json({
      error: "An error occured while fetching leads",
    });
  }
});

//Api route to update a lead
App.put("/leads/:id", async (req, res) => {
  const id = req.params.id;
  const updatedData = req.body;
  try {
    const updatedLead = await Lead.findByIdAndUpdate(id, updatedData, {
      new: true,
    }).populate("salesAgent", "name");
    if (!updatedLead) {
      return res.status(404).json({
        error: `Lead with id: ${id} not found.`,
      });
    } else {
      return res.status(200).json({
        message: "Lead updated successfully",
        updatedLead,
      });
    }
  } catch (error) {
    console.log("An error occured: ", error);
    return res.status(500).json({
      error: "An error occured while updated the Lead",
    });
  }
});

//Api route to delete a lead
App.delete("/leads/:id", async (req, res) => {
  const id = req.params.id;
  try {
    const deletedLead = await Lead.findByIdAndDelete(id);
    if (deletedLead) {
      return res.status(200).json({
        message: `Lead with id: ${id} is deleted successfully.`,
        deletedLead,
      });
    } else {
      return res.status(404).json({
        error: `Lead with id: ${id} not found.`,
      });
    }
  } catch (error) {
    console.log("An erorr occured: ", error);
    return res.status(500).json({
      error: "An error occured while deleted the lead",
    });
  }
});
/////////////////////////////////////////////////////////////////////

const newSalesAgent = {
  name: "Bob Williams",
  email: "bobwilliams@example.com",
};

//Add new sales agent function
async function createSalesAgent(newSalesAgent) {
  try {
    const salesAgent = new SalesAgent(newSalesAgent);
    const savedSalesAgent = await salesAgent.save();
    return savedSalesAgent;
  } catch (error) {
    throw error;
  }
}
//createSalesAgent(newSalesAgent);

//Route to create new agent
App.post("/agents", async (req, res) => {
  const { name, email } = req.body;
  if (!name || !email) {
    return res.status(400).json({
      error: "Invalid input: 'name' and 'email' are required.",
    });
  }
  //validate email
  const emailRegex = /^\S+@\S+\.\S+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({
      error: "Invalid input: 'email' must be a valid email address.",
    });
  }

  try {
    //vadiation for unique email
    const isExisting = await SalesAgent.findOne({ email: email });
    if (isExisting) {
      return res.status(409).json({
        error: `Sales agent with email '${email}' already exists.`,
      });
    }
    //create and save sales agent
    const savedAgent = await createSalesAgent(req.body);
    return res.status(201).json({
      savedAgent,
    });
  } catch (error) {
    console.error("Error while saving agent:", error);
    return res.status(500).json({
      error: "An error occured while creating new sales agent.",
    });
  }
});

// Route to fetch all sales agent
App.get("/agents", async (req, res) => {
  try {
    const agents = await SalesAgent.find();
    if (agents) {
      return res.status(200).json({ agents });
    } else {
      return res.status(404).json({
        error: "No sales agent found.",
      });
    }
  } catch (error) {
    return res.status(500).json({
      error: "An error occured while finding sales agents.",
    });
  }
});

////////////////////////////////////////////////////////////////////////////////////////////////////////

//API to create new Comment
App.post("/leads/:id/comments", async (req, res) => {
  try {
    const leadId = req.params.id;
    const { commentText, author } = req.body;
    const newComment = {
      lead: leadId,
      author,
      commentText,
    };
    if (!commentText || !author) {
      return res.status(400).json({
        error: "comment text and author are mandatory",
      });
    }

    const lead = await Lead.findById(leadId);
    if (!lead) {
      return res.status(404).json({
        error: "Lead not found.",
      });
    }
    const comment = new Comment(newComment);
    const savedComment = await comment.save();
    res.status(201).json(savedComment);
  } catch (error) {
    console.error("Error creating comment:", error.message, error.stack);
    return res.status(500).json({ error: error.message });
  }
});

//api route for fetching all comments
App.get("/leads/:id/comments", async (req, res) => {
  try {
    const leadId = req.params.id;
    const lead = await Lead.findById(leadId);
    if (!lead) {
      return res.status(404).json({
        error: "Lead not found.",
      });
    }
    const comments = await Comment.find({ lead: leadId });
    if (comments.length > 0) {
      return res.status(200).json({
        comments,
      });
    } else {
      return res.status(404).json({
        error: "No comment found.",
      });
    }
  } catch (error) {
    console.error("Error creating comment:", error);
    return res.status(500).json({ error: "Internal server error." });
  }
});
////////////////////////////////////////////////////////////////////////////////////////////////////////

//route to Fetch the total number of leads currently in the pipeline (all statuses except Closed).
App.get("/report/pipeline", async (req, res) => {
  try {
    const totalLeadsInPipeline = await Lead.countDocuments({
      status: { $ne: "Closed" },
    });

    res.status(200).json({ totalLeadsInPipeline });
  } catch (error) {
    console.error("Error fetching pipeline report:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

//route to get closed by agent
App.get("/report/closed-by-agent", async (req, res) => {
  try {
    const closedLeads = await Lead.find({ status: "Closed" }).populate(
      "salesAgent"
    );

    const byAgent = {};

    closedLeads.forEach((lead) => {
      const agentName = lead.salesAgent?.name || "Unassigned";
      byAgent[agentName] = (byAgent[agentName] || 0) + 1;
    });

    const result = Object.entries(byAgent).map(([agent, count]) => ({
      agent,
      count,
    }));

    res.json({
      totalClosed: closedLeads.length,
      byAgent: result,
    });
  } catch (err) {
    console.error("Error generating closed-by-agent report:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

App.get("/report/status-distribution", async (req, res) => {
  try {
    const leads = await Lead.find();

    const byStatus = {};

    leads.forEach((lead) => {
      const status = lead.status || "Unknown";
      byStatus[status] = (byStatus[status] || 0) + 1;
    });

    const result = Object.entries(byStatus).map(([status, count]) => ({
      status,
      count,
    }));

    res.json({ byStatus: result });
  } catch (err) {
    console.error("Error generating status-distribution report:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});
///////////////////////////////////////////////////////////////////////////////////////////////////////
//Port code
const port = process.env.PORT || 3000;
App.listen(port, () => {
  console.log("App is running on port no: ", port);
});
