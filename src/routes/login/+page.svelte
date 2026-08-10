<script>
    let username = $state('');
    let email = $state('');
    let password = $state('');
    let confirmPassword = $state('');

    let isAuthenticated = $state(false);
</script>

<section>
    <form action="/login" method="post">
        <div>
            <label for="username">Username:</label>
            <input type="text" id="username" bind:value={username} />
        </div>
        <div>
            <label for="email">Email:</label>
            <input type="email" id="email" bind:value={email} />
        </div>
        <div>
            <label for="password">Password:</label>
            <input type="password" id="password" bind:value={password} />
        </div>
        <div>
            <label for="confirmPassword">Confirm Password:</label>
            <input type="password" id="confirmPassword" bind:value={confirmPassword} />
        </div>
        <button type="submit">Login</button>
    </form>
</section>