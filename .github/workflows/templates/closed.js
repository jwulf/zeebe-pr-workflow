module.exports.closed = `<div>
    <p>
        Pull Request #{{event.number}} in {{event.pull_request.base.repo.full_name}} by
        {{event.pull_request.head.user.login}} now closed.
    </p>
    <p>
        View the pull request at <a
            href="{{event.pull_request._links.html.href}}">{{event.pull_request._links.html.href}}</a>.
    </p>
</div>`;
