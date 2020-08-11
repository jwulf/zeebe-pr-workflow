# Zeebe PR Workflow Demo

A demonstration of the Zeebe GitHub Action. In this Getting Started Guide, you will use the Zeebe GitHub Action to automatically deploy BPMN workflows to Camunda Cloud on push to master, and to start a workflow when a new PR is opened and closed.

## Prerequisites:

* Zeebe Modeler

## Create a GitHub repo

## Create a Zeebe Cluster in Camunda Cloud

## Configure Client Connection Credentials

* Go into your Zeebe cluster in the Camunda Cloud console, and create a new client. You might want to name it "GitHub-Automation" so you know what it is for.
* Copy the "Connection Info" block by clicking the copy icon in the lower right-hand corner.

## Configure Secrets in your GitHub repo

* In your GitHub repo, go to the repository settings Secrets configuration. Add a new Secret named `ZEEBE_CLIENT_CONFIG` and paste the Connection Info in there.

## Create a new model

* Open the Zeebe Modeler, and create a new BPMN Diagram.
* Add an End event.
* Click on the blank area of the canvas to access the properties for the process itself.
* Set the Id to `pr-workflow`.
* Set the Name to `PR Workflow`.

The model should look like this: 

![](assets/zeebe-github-model-1.png)

## Create a GitHub workflow to deploy on push

We will create a GitHub workflow to deploy the model on a push to the master branch of the repo.

* Create a folder `.github/workflows` in the root of your repository.
* Create a file in there called `deploy-bpmn-from-master.yml`.
* Paste in the following content: 

```yaml
name: Deploy Workflows

on:
  push:
    branches:
      - master
    paths:
      - 'bpmn/*'

jobs:
  deploy-workflows:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v2
      - name: Deploy Updated Workflows
        uses: jwulf/zeebe-action@master
        with:
          clientConfig: ${{ secrets.ZEEBE_CLIENT_CONFIG }}
          operation: deployWorkflow
          bpmnDirectory: bpmn
```

## Commit and push to master 

* Add the files: 

```
git add .
git commit -m "Initial commit"
git push
```

## View Deployed Workflow in Operate

* Go to your cluster overview in Camunda Cloud.
* Click on "View in Operate" at the bottom of the Overview.
* You will see "PR Workflow - 0 Instances in 1 Version" in the "Instances by Workflow" tab.

If you don't see it in there, the deployment may have failed. You can check the GitHub Action execution to see what happened.

## View GitHub Action execution 

* Open your repository on GitHub.
* Click on Actions.
* You will see the run of your workflow in here. 

You can click into it and inspect its execution, and debug any issues.

## Start a Workflow Instance when a Pull Request is opened

* In the `.github/workflows` directory, create the file `start-wfi-on-pr.yml`.
* Paste in the following content: 

```yaml
name: Open PR

on:
  pull_request:
    types: [opened]

jobs:
  open-pr-workflow:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v2
      - name: Start Workflow on PR Opened
        uses: jwulf/zeebe-action@master
        with:
          clientConfig: ${{ secrets.ZEEBE_CLIENT_CONFIG }}
          operation: createWorkflowInstance
          bpmnProcessId: pr-workflow
          variables: '{"pr": ${{ toJson(github.event) }}'
```
* Commit the new file, and push to master.

## Create a PR

Now we will create a PR to test the workflow creation.

* Create a new branch in your repo:

```
git checkout -b pr-1
```

* Create a file in your repo called `README.md`. Put any content you like in it. 

* Add the file, commit, and push to the remote.

```
git add .
git commit -m "Add README"
git push --set-upstream origin pr-1
```

## View GitHub Action execution 

* Open your repository on GitHub.
* Click on Actions.
* You will see the run of your workflow in here. 

You can click into it and inspect its execution, and debug any issues.

## View the Workflow Instance in Camunda Cloud

* Go to your cluster in the Camunda Cloud console at [https://camunda.io](https://camunda.io).
* In the overview, click on "View Instances".
* Click on "PR Workflow" in the "Instances by Workflow" column.
* In the Workflows view, click on the Filter checkbox for "Finished Instances".
* Click on the workflow execution in the "Instances panel".

Here you can examine the payload of the workflow, showing you the data received from the PR request.

## Merge Pull Request 

* Merge your pull request on GitHub.
* Switch back to master and pull the merge commit in your local repo:

```
git checkout master 
git pull 
```

## Add a Service Task 

* Open the model in the Zeebe Modeler.
* Rename the Start Event to "Open PR". This more accurately represents the semantics of the event.
* Add a Task between the Start and End event.
* Click the spanner/wrench icon on the Task and select "Service Task".
* In the properties panel, set the Name to "Send PR Opened Email".
* Set the Type to `send-email`.
* Save the model.

The model should look like this: 

![](assets/zeebe-github-model-2.png)

## Start a worker 

We will start a Zeebe task worker in the GitHub Open PR workflow.

* Edit the file `.github/workflows/start-wfi-on-pr.yml`. 
* Change the content to the following:

```yaml
name: Open PR

on:
  pull_request:
    types: [opened]

jobs:
  open-pr-workflow:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v2
      - name: Start Workflow on PR Opened
        uses: jwulf/zeebe-action@master
        with:
          clientConfig: ${{ secrets.ZEEBE_CLIENT_CONFIG }}
          operation: createWorkflowInstance
          bpmnProcessId: pr-workflow
      - name: Start Worker
        uses: jwulf/zeebe-action@master
        with:
          clientConfig: ${{ secrets.ZEEBE_CLIENT_CONFIG }}
          operation: startWorkers
          workerHandlerFile: .github/workflows/workers.js
          workerLifetimeMins: 1

```

## Write the worker code

* In the directory `.github/workflows`, create a file `workers.js`.
* Paste the following content: 

```javascript
module.exports = {
  tasks: {
    "send-email": (job, complete) => {
      log.info(JSON.stringify(job, null, 2));
      complete.success();
    },
  },
};
```

## Push to master 

* Commit the changes to the model and push to master:

```
git add .
git push 
```

## Create a worker

## Send an email on PR opening 

We will send an email to the PR 