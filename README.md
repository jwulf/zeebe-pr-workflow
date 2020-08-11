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
  start-pr-workflow:
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

## Send an email on PR opening 

We will send an email to the PR 